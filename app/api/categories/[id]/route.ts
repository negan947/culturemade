import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';

// Validation schema for category identifier (ID or slug)
const categoryIdentifierSchema = z.object({
  id: z.string().min(1, 'Category identifier is required'),
});

// Validation schema for category updates
const updateCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  slug: z.string().min(1, 'Slug is required').max(100, 'Slug too long').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format').optional(),
  description: z.string().nullable().optional(),
  parent_id: z.string().uuid().nullable().optional(),
  position: z.number().int().min(0).nullable().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate category identifier
    const { id: identifier } = categoryIdentifierSchema.parse(params);
    const { searchParams } = new URL(request.url);
    
    // Check if this is a products request (for /categories/{id}/products endpoint)
    const isProductsRequest = searchParams.get('products') === 'true';
    
    const includeProducts = searchParams.get('include_products') === 'true' || isProductsRequest;
    const includeSubcategories = searchParams.get('include_subcategories') === 'true';
    const productsLimit = parseInt(searchParams.get('limit') || searchParams.get('products_limit') || '20');
    const productsOffset = parseInt(searchParams.get('offset') || searchParams.get('products_offset') || '0');
    const page = parseInt(searchParams.get('page') || '1');
    const sort = searchParams.get('sort') || 'position';
    const direction = searchParams.get('direction') || 'asc';
    const status = searchParams.get('status') || 'active';
    const featured = searchParams.get('featured') === 'true';
    const minPrice = searchParams.get('min_price') ? parseFloat(searchParams.get('min_price')!) : undefined;
    const maxPrice = searchParams.get('max_price') ? parseFloat(searchParams.get('max_price')!) : undefined;

    const supabase = createClient();

    // Determine if identifier is UUID or slug and find the category
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select(`
        id,
        name,
        slug,
        description,
        parent_id,
        position,
        created_at,
        updated_at
      `)
      .eq(isUUID ? 'id' : 'slug', identifier)
      .single();

    if (categoryError || !category) {
      return NextResponse.json({
        success: false,
        error: 'Category not found',
        details: categoryError?.message || 'Category does not exist'
      }, { status: 404 });
    }

    // Initialize result with category data
    let result: any = { ...category };

    // Get category IDs to search in (for subcategory inclusion)
    let categoryIds = [category.id];
    
    // If include_subcategories is true, get all descendant categories
    if (includeSubcategories) {
      const getAllDescendants = async (parentId: string): Promise<string[]> => {
        const { data: children, error: childError } = await supabase
          .from('categories')
          .select('id')
          .eq('parent_id', parentId);

        if (childError || !children) return [];

        let allDescendants = children.map(child => child.id);
        
        // Recursively get descendants of each child
        for (const child of children) {
          const childDescendants = await getAllDescendants(child.id);
          allDescendants.push(...childDescendants);
        }

        return allDescendants;
      };

      const subcategoryIds = await getAllDescendants(category.id);
      categoryIds.push(...subcategoryIds);
    }

    // Get product count for the category (and subcategories if included)
    const { count: totalProductCount, error: countError } = await supabase
      .from('product_categories')
      .select('product_id', { count: 'exact', head: true })
      .in('category_id', categoryIds);

    const productCount = totalProductCount || 0;
    result.product_count = productCount;

    // Add subcategory count
    const { data: subcategoryCountData, error: subCountError } = await supabase
      .from('categories')
      .select('id')
      .eq('parent_id', category.id);

    if (!subCountError) {
      result.subcategory_count = subcategoryCountData?.length || 0;
    }

    // Include products if requested
    if (includeProducts && productCount > 0) {
      // Calculate offset for pagination
      const offset = page > 1 ? (page - 1) * productsLimit : productsOffset;

      // Build product query with joins
      let productQuery = supabase
        .from('product_categories')
        .select(`
          product_id,
          products!inner (
            id,
            name,
            slug,
            description,
            price,
            compare_at_price,
            status,
            featured,
            created_at,
            updated_at,
            product_images (
              id,
              url,
              alt_text,
              position
            ),
            product_variants!inner (
              id,
              name,
              price,
              quantity,
              sku,
              option1,
              option2,
              position
            )
          )
        `)
        .in('category_id', categoryIds);

      // Apply product filters
      productQuery = productQuery.eq('products.status', status);

      if (featured) {
        productQuery = productQuery.eq('products.featured', featured);
      }

      if (minPrice !== undefined) {
        productQuery = productQuery.gte('products.price', minPrice);
      }

      if (maxPrice !== undefined) {
        productQuery = productQuery.lte('products.price', maxPrice);
      }

      // Add sorting
      const sortColumn = sort === 'position' ? 'products.created_at' : `products.${sort}`;
      productQuery = productQuery.order(sortColumn, { ascending: direction === 'asc' });

      // Apply pagination
      productQuery = productQuery.range(offset, offset + productsLimit - 1);

      // Execute query
      const { data: productCategories, error: productsError } = await productQuery;

      if (!productsError && productCategories) {
        // Transform and deduplicate products (in case a product belongs to multiple subcategories)
        const productMap = new Map();
        
        productCategories.forEach(pc => {
          if (pc.products && !productMap.has(pc.products.id)) {
            const product = pc.products;
            
            // Calculate pricing information
            const variants = product.product_variants || [];
            const prices = variants.map(v => parseFloat(v.price?.toString() || product.price?.toString() || '0'));
            const minPriceValue = prices.length > 0 ? Math.min(...prices) : parseFloat(product.price?.toString() || '0');
            const maxPriceValue = prices.length > 0 ? Math.max(...prices) : parseFloat(product.price?.toString() || '0');
            
            // Calculate total inventory
            const totalInventory = variants.reduce((sum, v) => sum + (v.quantity || 0), 0);
            
            // Get primary image
            const primaryImage = product.product_images?.find(img => img.position === 0) || 
                                product.product_images?.[0] || null;

            const transformedProduct = {
              id: product.id,
              name: product.name,
              slug: product.slug,
              description: product.description,
              price: product.price?.toString() || '0',
              compare_at_price: product.compare_at_price?.toString() || null,
              status: product.status,
              featured: product.featured,
              created_at: product.created_at,
              variant_count: variants.length,
              min_price: minPriceValue.toString(),
              max_price: maxPriceValue.toString(),
              total_inventory: totalInventory,
              primary_image: primaryImage,
            };
            
            productMap.set(product.id, transformedProduct);
          }
        });

        const products = Array.from(productMap.values());
        result.products = products;

        // Build pagination info
        const totalPages = Math.ceil(productCount / productsLimit);
        const hasNext = page < totalPages;
        const hasPrev = page > 1;

        result.products_pagination = {
          page: page,
          limit: productsLimit,
          offset: offset,
          total: productCount,
          total_pages: totalPages,
          has_next: hasNext,
          has_prev: hasPrev,
        };

        // If this is a products-only request, return products-focused response
        if (isProductsRequest) {
          return NextResponse.json({
            success: true,
            data: {
              category: {
                ...category,
                product_count: productCount,
                subcategory_count: result.subcategory_count,
              },
              products,
              subcategories: includeSubcategories ? result.subcategories : null,
              pagination: result.products_pagination,
              filters: {
                sort,
                direction,
                status,
                featured,
                min_price: minPrice,
                max_price: maxPrice,
                include_subcategories: includeSubcategories || false,
              },
            }
          });
        }
      }
    }

    // Include subcategories if requested
    if (includeSubcategories && result.subcategory_count > 0) {
      const { data: subcategories, error: subcategoriesError } = await supabase
        .from('categories')
        .select(`
          id,
          name,
          slug,
          description,
          parent_id,
          position,
          created_at,
          updated_at
        `)
        .eq('parent_id', id)
        .order('position', { ascending: true });

      if (!subcategoriesError && subcategories) {
        // Add product counts to each subcategory
        const subcategoryIds = subcategories.map(sub => sub.id);
        const { data: subProductCounts, error: subCountsError } = await supabase
          .from('product_categories')
          .select('category_id, product_id')
          .in('category_id', subcategoryIds);

        const countMap = subProductCounts?.reduce((acc, pc) => {
          acc[pc.category_id] = (acc[pc.category_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};

        result.subcategories = subcategories.map(sub => ({
          ...sub,
          product_count: countMap[sub.id] || 0,
        }));
      }
    }

    // Get parent category info if it exists
    if (category.parent_id) {
      const { data: parentCategory, error: parentError } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('id', category.parent_id)
        .single();

      if (!parentError && parentCategory) {
        result.parent_category = parentCategory;
      }
    }

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Category GET API Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid category ID',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate category identifier
    const { id: identifier } = categoryIdentifierSchema.parse(params);
    const body = await request.json();
    const validatedData = updateCategorySchema.parse(body);

    const supabase = createClient();

    // Determine if identifier is UUID or slug and find the category
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    const { data: existingCategory, error: checkError } = await supabase
      .from('categories')
      .select('id, parent_id')
      .eq(isUUID ? 'id' : 'slug', identifier)
      .single();
    
    const id = existingCategory?.id;

    if (checkError || !existingCategory) {
      return NextResponse.json({
        success: false,
        error: 'Category not found',
        details: checkError?.message || 'Category does not exist'
      }, { status: 404 });
    }

    // If slug is being updated, check for uniqueness
    if (validatedData.slug) {
      const { data: slugCheck, error: slugError } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', validatedData.slug)
        .neq('id', id)
        .single();

      if (slugError && slugError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking slug uniqueness:', slugError);
        return NextResponse.json({
          success: false,
          error: 'Failed to validate slug',
          details: slugError.message
        }, { status: 500 });
      }

      if (slugCheck) {
        return NextResponse.json({
          success: false,
          error: 'Category with this slug already exists',
          details: { field: 'slug', message: 'Slug must be unique' }
        }, { status: 409 });
      }
    }

    // If parent_id is being updated, validate it exists and prevent circular references
    if (validatedData.parent_id !== undefined) {
      if (validatedData.parent_id === id) {
        return NextResponse.json({
          success: false,
          error: 'Cannot set category as its own parent',
          details: { field: 'parent_id', message: 'Circular reference not allowed' }
        }, { status: 400 });
      }

      if (validatedData.parent_id) {
        // Check if parent exists
        const { data: parentCategory, error: parentError } = await supabase
          .from('categories')
          .select('id')
          .eq('id', validatedData.parent_id)
          .single();

        if (parentError || !parentCategory) {
          return NextResponse.json({
            success: false,
            error: 'Parent category not found',
            details: { field: 'parent_id', message: 'Invalid parent category' }
          }, { status: 400 });
        }

        // Check for circular reference by checking if the new parent is a descendant
        const checkCircularReference = async (checkParentId: string, targetId: string): Promise<boolean> => {
          const { data: descendants, error: descError } = await supabase
            .from('categories')
            .select('id, parent_id')
            .eq('parent_id', targetId);

          if (descError || !descendants) return false;

          for (const desc of descendants) {
            if (desc.id === checkParentId) return true;
            if (await checkCircularReference(checkParentId, desc.id)) return true;
          }
          return false;
        };

        if (await checkCircularReference(validatedData.parent_id, id)) {
          return NextResponse.json({
            success: false,
            error: 'Circular reference detected',
            details: { field: 'parent_id', message: 'Cannot create circular reference in category hierarchy' }
          }, { status: 400 });
        }
      }
    }

    // Update the category
    const { data: updatedCategory, error: updateError } = await supabase
      .from('categories')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating category:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Failed to update category',
        details: updateError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: updatedCategory,
      message: 'Category updated successfully'
    });

  } catch (error) {
    console.error('Category PUT API Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid category data',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate category identifier
    const { id: identifier } = categoryIdentifierSchema.parse(params);
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    const supabase = createClient();

    // Determine if identifier is UUID or slug and find the category
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    const { data: existingCategory, error: checkError } = await supabase
      .from('categories')
      .select('id, name')
      .eq(isUUID ? 'id' : 'slug', identifier)
      .single();
    
    const id = existingCategory?.id;

    if (checkError || !existingCategory) {
      return NextResponse.json({
        success: false,
        error: 'Category not found',
        details: checkError?.message || 'Category does not exist'
      }, { status: 404 });
    }

    // Check for subcategories
    const { data: subcategories, error: subError } = await supabase
      .from('categories')
      .select('id')
      .eq('parent_id', id);

    if (subError) {
      console.error('Error checking subcategories:', subError);
      return NextResponse.json({
        success: false,
        error: 'Failed to check subcategories',
        details: subError.message
      }, { status: 500 });
    }

    if (subcategories && subcategories.length > 0 && !force) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete category with subcategories',
        details: {
          message: 'Category has subcategories. Use force=true to delete all subcategories.',
          subcategory_count: subcategories.length
        }
      }, { status: 409 });
    }

    // Check for products
    const { data: products, error: productError } = await supabase
      .from('product_categories')
      .select('product_id')
      .eq('category_id', id);

    if (productError) {
      console.error('Error checking products:', productError);
      return NextResponse.json({
        success: false,
        error: 'Failed to check products',
        details: productError.message
      }, { status: 500 });
    }

    if (products && products.length > 0 && !force) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete category with products',
        details: {
          message: 'Category has products. Use force=true to remove products from category.',
          product_count: products.length
        }
      }, { status: 409 });
    }

    // Start deletion process
    let deletedSubcategories = 0;
    let removedProducts = 0;

    if (force) {
      // Delete subcategories recursively
      if (subcategories && subcategories.length > 0) {
        for (const subcategory of subcategories) {
          const deleteResponse = await fetch(`${request.nextUrl.origin}/api/categories/${subcategory.id}?force=true`, {
            method: 'DELETE',
          });
          
          if (deleteResponse.ok) {
            deletedSubcategories++;
          }
        }
      }

      // Remove product associations
      if (products && products.length > 0) {
        const { error: removeProductError } = await supabase
          .from('product_categories')
          .delete()
          .eq('category_id', id);

        if (removeProductError) {
          console.error('Error removing product associations:', removeProductError);
          return NextResponse.json({
            success: false,
            error: 'Failed to remove product associations',
            details: removeProductError.message
          }, { status: 500 });
        }

        removedProducts = products.length;
      }
    }

    // Delete the category
    const { error: deleteError } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting category:', deleteError);
      return NextResponse.json({
        success: false,
        error: 'Failed to delete category',
        details: deleteError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully',
      data: {
        deleted_category: existingCategory.name,
        deleted_subcategories: deletedSubcategories,
        removed_product_associations: removedProducts,
      }
    });

  } catch (error) {
    console.error('Category DELETE API Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid category ID',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
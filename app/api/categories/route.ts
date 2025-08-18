import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';
import { ValidationSchemas } from '@/types/api';

// Validation schema for category list parameters
const categoryListParamsSchema = z.object({
  include_counts: z.string().nullable().optional().transform((val) => val === 'true'),
  include_hierarchy: z.string().nullable().optional().transform((val) => val === 'true'),
  parent_id: z.string().uuid().nullable().optional(),
  level: z.string().nullable().optional().transform((val) => val ? parseInt(val, 10) : undefined),
  sort: z.enum(['name', 'position', 'created_at', 'product_count']).nullable().optional().default('position'),
  direction: z.enum(['asc', 'desc']).nullable().optional().default('asc'),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Validate query parameters
    const params = categoryListParamsSchema.parse({
      include_counts: searchParams.get('include_counts'),
      include_hierarchy: searchParams.get('include_hierarchy'),
      parent_id: searchParams.get('parent_id'),
      level: searchParams.get('level'),
      sort: searchParams.get('sort'),
      direction: searchParams.get('direction'),
    });

    const supabase = createClient();

    // Build base query
    let query = supabase
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
      `);

    // Add hierarchy filtering
    if (params.parent_id !== undefined) {
      if (params.parent_id === null) {
        // Get root categories (no parent)
        query = query.is('parent_id', null);
      } else {
        // Get categories with specific parent
        query = query.eq('parent_id', params.parent_id);
      }
    }

    // Add sorting
    const sortColumn = params.sort === 'product_count' ? 'position' : params.sort; // Fallback for product_count
    query = query.order(sortColumn, { ascending: params.direction === 'asc' });

    // Execute query
    const { data: categories, error } = await query;

    if (error) {
      console.error('Error fetching categories:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch categories',
        details: error.message
      }, { status: 500 });
    }

    // If include_counts is true, fetch product counts for each category
    let categoriesWithCounts = categories;
    if (params.include_counts && categories) {
      const categoryIds = categories.map(cat => cat.id);
      
      // Get product counts for each category
      const { data: productCounts, error: countsError } = await supabase
        .from('product_categories')
        .select(`
          category_id,
          product_id
        `)
        .in('category_id', categoryIds);

      if (countsError) {
        console.error('Error fetching product counts:', countsError);
        // Continue without counts rather than failing
      } else {
        // Count products per category
        const countMap = productCounts?.reduce((acc, pc) => {
          acc[pc.category_id] = (acc[pc.category_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};

        // Get subcategory counts
        const { data: subcategoryCounts, error: subCountsError } = await supabase
          .from('categories')
          .select('parent_id')
          .in('parent_id', categoryIds);

        const subCountMap = subcategoryCounts?.reduce((acc, sub) => {
          if (sub.parent_id) {
            acc[sub.parent_id] = (acc[sub.parent_id] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>) || {};

        // Add counts to categories
        categoriesWithCounts = categories.map(category => ({
          ...category,
          product_count: countMap[category.id] || 0,
          subcategory_count: subCountMap[category.id] || 0,
        }));
      }
    }

    // If include_hierarchy is true, build hierarchical structure
    let result = categoriesWithCounts;
    if (params.include_hierarchy && categoriesWithCounts) {
      // For hierarchy, we need to fetch all categories to build the tree
      if (params.parent_id === undefined) {
        const { data: allCategories, error: allCatsError } = await supabase
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
          .order('position', { ascending: true });

        if (allCatsError) {
          console.error('Error fetching all categories for hierarchy:', allCatsError);
        } else {
          // Build hierarchy tree
          const categoryMap = new Map(allCategories.map(cat => [cat.id, { ...cat, children: [] }]));
          const rootCategories: any[] = [];

          allCategories.forEach(category => {
            const categoryWithChildren = categoryMap.get(category.id)!;
            
            if (category.parent_id) {
              const parent = categoryMap.get(category.parent_id);
              if (parent) {
                parent.children.push(categoryWithChildren);
              }
            } else {
              rootCategories.push(categoryWithChildren);
            }
          });

          // Add counts if requested
          if (params.include_counts) {
            const addCountsToHierarchy = async (cats: any[]) => {
              for (const cat of cats) {
                const countsData = categoriesWithCounts.find(c => c.id === cat.id);
                if (countsData) {
                  cat.product_count = countsData.product_count;
                  cat.subcategory_count = countsData.subcategory_count;
                }
                if (cat.children && cat.children.length > 0) {
                  await addCountsToHierarchy(cat.children);
                }
              }
            };
            await addCountsToHierarchy(rootCategories);
          }

          result = rootCategories;
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        total: result?.length || 0,
        include_counts: params.include_counts || false,
        include_hierarchy: params.include_hierarchy || false,
        parent_id: params.parent_id,
        sort: params.sort,
        direction: params.direction,
      }
    });

  } catch (error) {
    console.error('Categories API Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid parameters',
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validation schema for creating categories
    const createCategorySchema = z.object({
      name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
      slug: z.string().min(1, 'Slug is required').max(100, 'Slug too long').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format'),
      description: z.string().nullable().optional(),
      parent_id: z.string().uuid().nullable().optional(),
      position: z.number().int().min(0).nullable().optional(),
    });

    const validatedData = createCategorySchema.parse(body);
    const supabase = createClient();

    // Check if slug already exists
    const { data: existingCategory, error: checkError } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', validatedData.slug)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing category:', checkError);
      return NextResponse.json({
        success: false,
        error: 'Failed to validate category',
        details: checkError.message
      }, { status: 500 });
    }

    if (existingCategory) {
      return NextResponse.json({
        success: false,
        error: 'Category with this slug already exists',
        details: { field: 'slug', message: 'Slug must be unique' }
      }, { status: 409 });
    }

    // If parent_id is provided, validate it exists
    if (validatedData.parent_id) {
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
    }

    // Set position if not provided
    if (validatedData.position === undefined) {
      const { data: maxPositionData, error: positionError } = await supabase
        .from('categories')
        .select('position')
        .eq('parent_id', validatedData.parent_id || null)
        .order('position', { ascending: false })
        .limit(1);

      if (positionError) {
        console.error('Error getting max position:', positionError);
        validatedData.position = 0;
      } else {
        const maxPosition = maxPositionData?.[0]?.position || 0;
        validatedData.position = maxPosition + 1;
      }
    }

    // Create the category
    const { data: newCategory, error: insertError } = await supabase
      .from('categories')
      .insert([validatedData])
      .select()
      .single();

    if (insertError) {
      console.error('Error creating category:', insertError);
      return NextResponse.json({
        success: false,
        error: 'Failed to create category',
        details: insertError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: newCategory,
      message: 'Category created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Categories POST API Error:', error);
    
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
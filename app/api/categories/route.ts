import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse, Category } from '@/types/ecommerce'

/**
 * GET /api/categories - Get product categories with hierarchy
 * 
 * Query Parameters:
 * - includeEmpty: Include categories with no products (default: false)
 * - parentId: Filter by parent category ID (for nested navigation)
 * - flat: Return flat list instead of hierarchy (default: false)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeEmpty = searchParams.get('includeEmpty') === 'true'
    const parentId = searchParams.get('parentId') || undefined
    const flat = searchParams.get('flat') === 'true'
    
    const supabase = await createClient()
    
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
        updated_at,
        product_categories(count)
      `)
      .order('position', { ascending: true })
      .order('name', { ascending: true })
    
    // Filter by parent if specified
    if (parentId) {
      query = query.eq('parent_id', parentId)
    }
    
    const { data: categories, error } = await query
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json<ApiResponse>({
        success: false,
        data: null,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch categories'
        }
      }, { status: 500 })
    }
    
    if (!categories) {
      return NextResponse.json<ApiResponse<Category[]>>({
        success: true,
        data: []
      })
    }
    
    // Transform categories with computed properties
    const transformedCategories: Category[] = categories.map(category => {
      const productCount = category.product_categories?.[0]?.count || 0
      
      return {
        ...category,
        // Computed properties
        isRoot: !category.parent_id,
        hasChildren: false, // Will be calculated below
        fullPath: category.name, // Will be calculated below for hierarchy
        depth: 0, // Will be calculated below for hierarchy
        productCount,
        isActive: productCount > 0 || includeEmpty
      }
    })
    
    // Filter out empty categories if not requested
    const filteredCategories = includeEmpty 
      ? transformedCategories
      : transformedCategories.filter(cat => cat.productCount > 0)
    
    // If flat list requested, return as-is
    if (flat || parentId) {
      // Calculate children count for each category
      const categoriesWithChildren = filteredCategories.map(category => ({
        ...category,
        hasChildren: filteredCategories.some(cat => cat.parent_id === category.id)
      }))
      
      const response: ApiResponse<Category[]> = {
        success: true,
        data: categoriesWithChildren
      }
      
      return NextResponse.json(response, {
        headers: {
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200' // Cache for 10 minutes
        }
      })
    }
    
    // Build hierarchical structure
    const categoryMap = new Map(filteredCategories.map(cat => [cat.id, { ...cat, children: [] }]))
    const rootCategories: Category[] = []
    
    // First pass: organize into hierarchy
    filteredCategories.forEach(category => {
      const categoryWithChildren = categoryMap.get(category.id)!
      
      if (category.parent_id) {
        const parent = categoryMap.get(category.parent_id)
        if (parent) {
          parent.children = parent.children || []
          parent.children.push(categoryWithChildren)
          parent.hasChildren = true
        }
      } else {
        rootCategories.push(categoryWithChildren)
      }
    })
    
    // Second pass: calculate full paths and depths
    function calculateHierarchyData(categories: Category[], parentPath = '', depth = 0) {
      categories.forEach(category => {
        category.fullPath = parentPath ? `${parentPath} / ${category.name}` : category.name
        category.depth = depth
        
        if (category.children && category.children.length > 0) {
          calculateHierarchyData(category.children, category.fullPath, depth + 1)
        }
      })
    }
    
    calculateHierarchyData(rootCategories)
    
    const response: ApiResponse<Category[]> = {
      success: true,
      data: rootCategories
    }
    
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200' // Cache for 10 minutes
      }
    })
    
  } catch (error) {
    console.error('Categories API error:', error)
    
    return NextResponse.json<ApiResponse>({
      success: false,
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    }, { status: 500 })
  }
} 
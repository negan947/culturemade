import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';

// Validation schema for tree parameters
const treeParamsSchema = z.object({
  include_counts: z.string().nullable().optional().transform((val) => val === 'true'),
  max_depth: z.string().nullable().optional().transform((val) => val ? parseInt(val, 10) : undefined),
  root_id: z.string().uuid().nullable().optional(),
});

interface CategoryTreeItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  position: number | null;
  created_at: string | null;
  updated_at: string | null;
  product_count?: number;
  subcategory_count?: number;
  children: CategoryTreeItem[];
  depth: number;
  path: string[]; // Array of parent slugs for breadcrumb navigation
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Validate query parameters
    const params = treeParamsSchema.parse({
      include_counts: searchParams.get('include_counts'),
      max_depth: searchParams.get('max_depth'),
      root_id: searchParams.get('root_id'),
    });

    const supabase = createClient();

    // Fetch all categories
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
      `)
      .order('position', { ascending: true });

    // If root_id is specified, we'll filter later to include only that branch
    const { data: allCategories, error } = await query;

    if (error) {
      console.error('Error fetching categories for tree:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch categories',
        details: error.message
      }, { status: 500 });
    }

    if (!allCategories || allCategories.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        meta: {
          total_categories: 0,
          max_depth: 0,
          include_counts: params.include_counts || false,
        }
      });
    }

    // Get product counts if requested
    let productCountMap: Record<string, number> = {};
    if (params.include_counts) {
      const categoryIds = allCategories.map(cat => cat.id);
      
      const { data: productCounts, error: countsError } = await supabase
        .from('product_categories')
        .select('category_id, product_id')
        .in('category_id', categoryIds);

      if (countsError) {
        console.error('Error fetching product counts:', countsError);
        // Continue without counts rather than failing
      } else {
        productCountMap = productCounts?.reduce((acc, pc) => {
          acc[pc.category_id] = (acc[pc.category_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};
      }
    }

    // Build category map for efficient lookups
    const categoryMap = new Map<string, CategoryTreeItem>();
    const childrenMap = new Map<string, CategoryTreeItem[]>();

    // Initialize all categories in the map
    allCategories.forEach(category => {
      const treeItem: CategoryTreeItem = {
        ...category,
        children: [],
        depth: 0,
        path: [],
        ...(params.include_counts && {
          product_count: productCountMap[category.id] || 0,
        }),
      };
      
      categoryMap.set(category.id, treeItem);
      
      // Initialize children arrays
      if (!childrenMap.has(category.parent_id || 'root')) {
        childrenMap.set(category.parent_id || 'root', []);
      }
      childrenMap.get(category.parent_id || 'root')!.push(treeItem);
    });

    // Function to build the tree recursively
    const buildTree = (
      parentId: string | null,
      depth: number = 0,
      parentPath: string[] = []
    ): CategoryTreeItem[] => {
      const children = childrenMap.get(parentId || 'root') || [];
      
      return children
        .filter(child => {
          // Apply max_depth filter if specified
          return !params.max_depth || depth < params.max_depth;
        })
        .map(child => {
          const childPath = [...parentPath, child.slug];
          const updatedChild: CategoryTreeItem = {
            ...child,
            depth,
            path: parentPath,
            children: buildTree(child.id, depth + 1, childPath),
          };

          // Add subcategory count if requested
          if (params.include_counts) {
            updatedChild.subcategory_count = updatedChild.children.length;
          }

          return updatedChild;
        })
        .sort((a, b) => (a.position || 0) - (b.position || 0));
    };

    // Build the tree starting from root or specified root_id
    let tree: CategoryTreeItem[];
    if (params.root_id) {
      // Build tree starting from specific category
      const rootCategory = categoryMap.get(params.root_id);
      if (!rootCategory) {
        return NextResponse.json({
          success: false,
          error: 'Root category not found',
          details: 'The specified root_id does not exist'
        }, { status: 404 });
      }
      
      // Build path for root category
      const buildPath = (categoryId: string): string[] => {
        const category = categoryMap.get(categoryId);
        if (!category || !category.parent_id) return [];
        
        const parentPath = buildPath(category.parent_id);
        const parent = categoryMap.get(category.parent_id);
        return parent ? [...parentPath, parent.slug] : parentPath;
      };

      const rootPath = buildPath(params.root_id);
      rootCategory.depth = 0;
      rootCategory.path = rootPath;
      rootCategory.children = buildTree(params.root_id, 1, [...rootPath, rootCategory.slug]);
      
      if (params.include_counts) {
        rootCategory.subcategory_count = rootCategory.children.length;
      }
      
      tree = [rootCategory];
    } else {
      // Build full tree from root categories
      tree = buildTree(null, 0, []);
    }

    // Calculate tree statistics
    const calculateTreeStats = (nodes: CategoryTreeItem[]): { maxDepth: number; totalNodes: number } => {
      let maxDepth = 0;
      let totalNodes = nodes.length;
      
      nodes.forEach(node => {
        maxDepth = Math.max(maxDepth, node.depth);
        if (node.children.length > 0) {
          const childStats = calculateTreeStats(node.children);
          maxDepth = Math.max(maxDepth, childStats.maxDepth + 1);
          totalNodes += childStats.totalNodes;
        }
      });
      
      return { maxDepth, totalNodes };
    };

    const treeStats = calculateTreeStats(tree);

    return NextResponse.json({
      success: true,
      data: tree,
      meta: {
        total_categories: allCategories.length,
        tree_categories: treeStats.totalNodes,
        max_depth: treeStats.maxDepth,
        include_counts: params.include_counts || false,
        root_id: params.root_id || null,
        applied_max_depth: params.max_depth || null,
      }
    });

  } catch (error) {
    console.error('Categories Tree API Error:', error);
    
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
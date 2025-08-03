import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';

// Validation schema for suggestion parameters
const suggestionParamsSchema = z.object({
  q: z.string().min(1, 'Search query is required').max(100, 'Search query too long'),
  limit: z.string().nullable().optional().transform((val) => val ? Math.min(parseInt(val, 10), 20) : 8),
});

interface SuggestionItem {
  id: string;
  text: string;
  type: 'product' | 'category';
  product?: {
    id: string;
    name: string;
    price: string;
    image?: string;
  };
  category?: {
    id: string;
    name: string;
    product_count: number;
  };
}

// GET - Get search suggestions for autocomplete
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    
    // Validate parameters
    const validation = suggestionParamsSchema.safeParse({
      q: searchParams.get('q'),
      limit: searchParams.get('limit'),
    });

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid suggestion parameters',
          details: validation.error.errors
        },
        { status: 400 }
      );
    }

    const params = validation.data;
    const supabase = await createClient();
    const searchQuery = params.q.trim().toLowerCase();

    // Get product suggestions
    const { data: products } = await supabase
      .from('products')
      .select(`
        id,
        name,
        price,
        product_images(
          id,
          url,
          alt_text,
          position
        )
      `)
      .ilike('name', `%${searchQuery}%`)
      .eq('status', 'active')
      .order('name', { ascending: true })
      .limit(Math.max(params.limit - 2, 4)); // Reserve space for categories

    // Get category suggestions
    const { data: categories } = await supabase
      .from('categories')
      .select(`
        id,
        name,
        product_categories(count)
      `)
      .ilike('name', `%${searchQuery}%`)
      .limit(2);

    const suggestions: SuggestionItem[] = [];

    // Add product suggestions
    if (products) {
      products.forEach((product: any) => {
        const primaryImage = product.product_images
          ?.sort((a: any, b: any) => a.position - b.position)[0];
        
        suggestions.push({
          id: `product-${product.id}`,
          text: product.name,
          type: 'product',
          product: {
            id: product.id,
            name: product.name,
            price: product.price,
            image: primaryImage?.url,
          },
        });
      });
    }

    // Add category suggestions
    if (categories) {
      categories.forEach((category: any) => {
        const productCount = category.product_categories?.length || 0;
        
        suggestions.push({
          id: `category-${category.id}`,
          text: category.name,
          type: 'category',
          category: {
            id: category.id,
            name: category.name,
            product_count: productCount,
          },
        });
      });
    }

    // Sort suggestions by relevance (exact matches first, then partial)
    suggestions.sort((a, b) => {
      const aExact = a.text.toLowerCase().startsWith(searchQuery) ? 1 : 0;
      const bExact = b.text.toLowerCase().startsWith(searchQuery) ? 1 : 0;
      
      if (aExact !== bExact) return bExact - aExact;
      
      // Then by position of search term
      const aPos = a.text.toLowerCase().indexOf(searchQuery);
      const bPos = b.text.toLowerCase().indexOf(searchQuery);
      
      return aPos - bPos;
    });

    const response = {
      success: true,
      suggestions: suggestions.slice(0, params.limit),
      search_info: {
        query: params.q,
        suggestion_count: suggestions.length,
        search_time_ms: Date.now() - startTime,
      },
    };

    return NextResponse.json(response);

  } catch (error: any) {
    
    return NextResponse.json(
      { error: 'Failed to get search suggestions' },
      { status: 500 }
    );
  }
}


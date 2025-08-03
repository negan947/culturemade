import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';

// Validation schema for search parameters
const searchParamsSchema = z.object({
  q: z.string().min(1, 'Search query is required').max(100, 'Search query too long'),
  page: z.string().nullable().optional().transform((val) => val ? parseInt(val, 10) : 1),
  limit: z.string().nullable().optional().transform((val) => val ? Math.min(parseInt(val, 10), 50) : 20),
  category: z.string().uuid().nullable().optional(),
  min_price: z.string().nullable().optional().transform((val) => val ? parseFloat(val) : undefined),
  max_price: z.string().nullable().optional().transform((val) => val ? parseFloat(val) : undefined),
  sort: z.enum(['relevance', 'price', 'name', 'created_at']).nullable().optional().default('relevance'),
  direction: z.enum(['asc', 'desc']).nullable().optional().default('desc'),
  suggest: z.string().nullable().optional().transform((val) => val === 'true'),
});

// Type definitions for search API responses
interface SearchSuggestion {
  id: string;
  name: string;
  price: string;
  primary_image: {
    id: string;
    url: string;
    alt_text: string | null;
  } | null;
}

interface SearchResultItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  compare_at_price: string | null;
  featured: boolean;
  min_price: string;
  max_price: string;
  total_inventory: number;
  primary_image: {
    id: string;
    url: string;
    alt_text: string | null;
    position: number;
  } | null;
  categories: {
    id: string;
    name: string;
    slug: string;
  }[];
  relevance_score?: number;
}

interface SearchResponse {
  success: boolean;
  data: SearchResultItem[];
  suggestions?: SearchSuggestion[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  search_info: {
    query: string;
    suggestions_only: boolean;
    filters_applied: string[];
    search_time_ms: number;
  };
}

// Track search analytics
async function trackSearchEvent(query: string, resultCount: number, request: NextRequest) {
  try {
    const supabase = await createClient();
    const userAgent = request.headers.get('user-agent') || '';
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';

    await supabase
      .from('analytics_events')
      .insert({
        event_type: 'product_search',
        search_query: query,
        result_count: resultCount,
        user_agent: userAgent,
        ip_address: ip,
        created_at: new Date().toISOString(),
      });

    return NextResponse.json(products);

  } catch (error: any) {
    
    return NextResponse.json(
      { error: 'Failed to search products' },
      { status: 500 }
    );
  }
}

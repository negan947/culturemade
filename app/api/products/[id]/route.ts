import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';

// Validation schema for product ID
const productIdSchema = z.object({
  id: z.string().uuid('Invalid product ID format'),
});

// Type definitions for product detail API response
interface ProductVariant {
  id: string;
  name: string;
  price: string | null;
  quantity: number;
  sku: string | null;
  option1: string | null;
  option2: string | null;
  position: number;
}

interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

interface ProductImage {
  id: string;
  url: string;
  alt_text: string | null;
  position: number;
}

interface RelatedProduct {
  id: string;
  name: string;
  slug: string;
  price: string;
  compare_at_price: string | null;
  primary_image: ProductImage | null;
}

interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  compare_at_price: string | null;
  status: 'active' | 'draft' | 'archived';
  featured: boolean;
  created_at: string;
  updated_at: string | null;
  variants: ProductVariant[];
  categories: ProductCategory[];
  images: ProductImage[];
  related_products: RelatedProduct[];
  total_inventory: number;
  min_price: string;
  max_price: string;
}

interface ProductDetailResponse {
  success: boolean;
  data: ProductDetail | null;
}

// Track product view analytics
async function trackProductView(productId: string, request: NextRequest) {
  try {
    const supabase = await createClient();
    const userAgent = request.headers.get('user-agent') || '';
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';

    await supabase
      .from('analytics_events')
      .insert({
        event_type: 'product_view',
        product_id: productId,
        user_agent: userAgent,
        ip_address: ip,
        created_at: new Date().toISOString(),
      });

    return NextResponse.json(product);

  } catch (error: any) {
    
    return NextResponse.json(
      { error: 'Failed to get product' },
      { status: 500 }
    );
  }
}

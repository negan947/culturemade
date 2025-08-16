import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAdmin } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/server';

const productsQuerySchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  category_id: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort_by: z.enum(['revenue', 'quantity', 'orders', 'profit']).default('revenue'),
  include_variants: z.boolean().default(false),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedParams = productsQuerySchema.parse(queryParams);
    
    const { start_date, end_date, category_id, limit, sort_by, include_variants } = validatedParams;

    const supabase = await createClient();

    // Set default date range (last 30 days)
    const endDate = end_date ? new Date(end_date) : new Date();
    const startDate = start_date 
      ? new Date(start_date) 
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const startIso = startDate.toISOString();
    const endIso = endDate.toISOString();

    // Get order items with product and category information
    let orderItemsQuery = supabase
      .from('order_items')
      .select(`
        product_id,
        product_name,
        variant_id,
        variant_name,
        quantity,
        price,
        subtotal,
        orders!inner(created_at, status),
        products!inner(
          name,
          cost,
          status,
          featured,
          product_categories!inner(
            categories!inner(id, name)
          )
        )
      `)
      .gte('orders.created_at', startIso)
      .lte('orders.created_at', endIso)
      .in('orders.status', ['completed', 'shipped', 'delivered']);

    if (category_id) {
      orderItemsQuery = orderItemsQuery.eq('products.product_categories.categories.id', category_id);
    }

    const { data: orderItems } = await orderItemsQuery;

    if (!orderItems) {
      return NextResponse.json({
        success: true,
        data: {
          summary: {},
          top_products: [],
          category_breakdown: {},
          insights: {},
        }
      });
    }

    // Aggregate product metrics
    const productMetrics = orderItems.reduce((acc, item) => {
      const productId = item.product_id;
      const cost = Number(item.products?.cost) || 0;
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 0;
      const subtotal = Number(item.subtotal) || 0;
      const profit = subtotal - (cost * quantity);

      if (!acc[productId]) {
        acc[productId] = {
          product_id: productId,
          product_name: item.product_name || item.products?.name,
          total_quantity: 0,
          total_revenue: 0,
          total_profit: 0,
          total_cost: 0,
          order_count: 0,
          unique_customers: new Set(),
          categories: item.products?.product_categories?.map(pc => pc.categories) || [],
          featured: item.products?.featured || false,
          status: item.products?.status || 'unknown',
          variants: include_variants ? {} : undefined,
        };
      }

      acc[productId].total_quantity += quantity;
      acc[productId].total_revenue += subtotal;
      acc[productId].total_profit += profit;
      acc[productId].total_cost += cost * quantity;
      acc[productId].order_count += 1;

      // Track variant performance if requested
      if (include_variants && item.variant_id) {
        const variantId = item.variant_id;
        if (!acc[productId].variants![variantId]) {
          acc[productId].variants![variantId] = {
            variant_id: variantId,
            variant_name: item.variant_name,
            quantity: 0,
            revenue: 0,
            orders: 0,
          };
        }
        acc[productId].variants![variantId].quantity += quantity;
        acc[productId].variants![variantId].revenue += subtotal;
        acc[productId].variants![variantId].orders += 1;
      }

      return acc;
    }, {} as Record<string, any>);

    // Calculate additional metrics
    Object.values(productMetrics).forEach((product: any) => {
      product.profit_margin = product.total_revenue ? (product.total_profit / product.total_revenue) * 100 : 0;
      product.average_order_value = product.order_count ? product.total_revenue / product.order_count : 0;
      product.average_quantity_per_order = product.order_count ? product.total_quantity / product.order_count : 0;
      
      // Convert variants object to array if needed
      if (include_variants && product.variants) {
        product.top_variants = Object.values(product.variants)
          .sort((a: any, b: any) => b.revenue - a.revenue)
          .slice(0, 5);
      }
    });

    // Sort products based on selected metric
    const sortedProducts = Object.values(productMetrics).sort((a: any, b: any) => {
      switch (sort_by) {
        case 'revenue':
          return b.total_revenue - a.total_revenue;
        case 'quantity':
          return b.total_quantity - a.total_quantity;
        case 'orders':
          return b.order_count - a.order_count;
        case 'profit':
          return b.total_profit - a.total_profit;
        default:
          return b.total_revenue - a.total_revenue;
      }
    });

    const topProducts = sortedProducts.slice(0, limit);

    // Category breakdown
    const categoryBreakdown = orderItems.reduce((acc, item) => {
      const categories = item.products?.product_categories || [];
      categories.forEach((pc: any) => {
        const category = pc.categories;
        if (category) {
          const categoryId = category.id;
          const categoryName = category.name;
          if (!acc[categoryId]) {
            acc[categoryId] = {
              category_id: categoryId,
              category_name: categoryName,
              total_revenue: 0,
              total_quantity: 0,
              product_count: new Set(),
              order_count: 0,
            };
          }
          acc[categoryId].total_revenue += Number(item.subtotal) || 0;
          acc[categoryId].total_quantity += Number(item.quantity) || 0;
          acc[categoryId].product_count.add(item.product_id);
          acc[categoryId].order_count += 1;
        }
      });
      return acc;
    }, {} as Record<string, any>);

    // Convert sets to counts
    Object.values(categoryBreakdown).forEach((category: any) => {
      category.unique_products = category.product_count.size;
      delete category.product_count;
    });

    // Summary metrics
    const totalProducts = Object.keys(productMetrics).length;
    const totalRevenue = Object.values(productMetrics).reduce((sum: number, p: any) => sum + p.total_revenue, 0);
    const totalQuantity = Object.values(productMetrics).reduce((sum: number, p: any) => sum + p.total_quantity, 0);
    const totalProfit = Object.values(productMetrics).reduce((sum: number, p: any) => sum + p.total_profit, 0);

    // Insights
    const insights = {
      bestseller: topProducts[0] || null,
      highest_profit_margin: sortedProducts.sort((a: any, b: any) => b.profit_margin - a.profit_margin)[0] || null,
      most_orders: sortedProducts.sort((a: any, b: any) => b.order_count - a.order_count)[0] || null,
      featured_performance: {
        featured_products: sortedProducts.filter((p: any) => p.featured),
        featured_revenue_share: 0,
      },
      low_performers: sortedProducts.slice(-5).reverse(),
    };

    // Calculate featured products revenue share
    const featuredRevenue = insights.featured_performance.featured_products
      .reduce((sum: number, p: any) => sum + p.total_revenue, 0);
    insights.featured_performance.featured_revenue_share = totalRevenue ? (featuredRevenue / totalRevenue) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          total_products: totalProducts,
          total_revenue: totalRevenue,
          total_quantity: totalQuantity,
          total_profit: totalProfit,
          average_revenue_per_product: totalProducts ? totalRevenue / totalProducts : 0,
          overall_profit_margin: totalRevenue ? (totalProfit / totalRevenue) * 100 : 0,
          date_range: {
            start_date: startIso,
            end_date: endIso,
            days: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
          },
        },
        top_products: topProducts,
        category_breakdown: Object.values(categoryBreakdown)
          .sort((a: any, b: any) => b.total_revenue - a.total_revenue),
        insights,
        metadata: {
          sort_by,
          include_variants,
          category_filter: category_id || null,
          limit,
        },
      },
    });

  } catch (error) {
    console.error('Products analytics error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products analytics' },
      { status: 500 }
    );
  }
}
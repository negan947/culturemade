import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const supabase = await createClient();

    // Low stock alerts (quantity < 10)
    const { data: lowStockItems } = await supabase
      .from('product_variants')
      .select(`
        id, sku, quantity, 
        products(id, name, category_id)
      `)
      .lt('quantity', 10)
      .order('quantity', { ascending: true })
      .limit(20);

    // Overstock items (quantity > 100)
    const { data: overstockItems } = await supabase
      .from('product_variants')
      .select(`
        id, sku, quantity,
        products(id, name, category_id)
      `)
      .gt('quantity', 100)
      .order('quantity', { ascending: false })
      .limit(20);

    // Total inventory value
    const { data: inventoryValue } = await supabase
      .from('product_variants')
      .select('quantity, price');

    const totalValue = inventoryValue?.reduce((sum, variant) => 
      sum + (Number(variant.quantity) * Number(variant.price)), 0
    ) || 0;

    const totalItems = inventoryValue?.reduce((sum, variant) => 
      sum + Number(variant.quantity), 0
    ) || 0;

    // Top selling products (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: topSelling } = await supabase
      .from('order_items')
      .select(`
        product_id, product_name, variant_id, variant_name,
        quantity, price,
        orders!inner(created_at, status)
      `)
      .gte('orders.created_at', thirtyDaysAgo.toISOString())
      .in('orders.status', ['completed', 'processing'])
      .order('quantity', { ascending: false })
      .limit(10);

    // Aggregate top selling by product
    const productSales = topSelling?.reduce((acc, item) => {
      const key = item.product_id;
      if (!acc[key]) {
        acc[key] = {
          product_id: key,
          product_name: item.product_name,
          total_quantity: 0,
          total_revenue: 0
        };
      }
      acc[key].total_quantity += Number(item.quantity);
      acc[key].total_revenue += Number(item.quantity) * Number(item.price);
      return acc;
    }, {} as Record<string, any>) || {};

    const topProducts = Object.values(productSales)
      .sort((a: any, b: any) => b.total_quantity - a.total_quantity)
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      data: {
        stock_alerts: {
          low_stock: lowStockItems || [],
          overstock: overstockItems || []
        },
        inventory_summary: {
          total_value: totalValue,
          total_items: totalItems,
          low_stock_count: lowStockItems?.length || 0,
          overstock_count: overstockItems?.length || 0
        },
        top_selling: topProducts
      }
    });

  } catch (error) {
    console.error('Inventory analytics error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch inventory analytics' },
      { status: 500 }
    );
  }
}
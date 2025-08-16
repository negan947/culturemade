import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAdmin } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/server';

// Validation schema for analytics query parameters
const analyticsQuerySchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  period: z.enum(['day', 'week', 'month', 'quarter', 'year']).default('month'),
  metric: z.enum(['revenue', 'orders', 'customers', 'products']).optional(),
  category_id: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
});

export async function GET(request: NextRequest) {
  try {
    // Ensure user is admin
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    const validatedParams = analyticsQuerySchema.parse(queryParams);
    const { start_date, end_date, period, metric, category_id, limit } = validatedParams;

    const supabase = await createClient();

    // Set default date range (last 30 days)
    const endDate = end_date ? new Date(end_date) : new Date();
    const startDate = start_date 
      ? new Date(start_date) 
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Format dates for PostgreSQL
    const startIso = startDate.toISOString();
    const endIso = endDate.toISOString();

    const analytics = {
      summary: {},
      trends: {},
      insights: {},
    };

    // Revenue Analytics
    if (!metric || metric === 'revenue') {
      const { data: revenueData } = await supabase
        .from('payments')
        .select('amount, currency, created_at, status')
        .eq('status', 'succeeded')
        .gte('created_at', startIso)
        .lte('created_at', endIso)
        .order('created_at', { ascending: true });

      const totalRevenue = revenueData?.reduce(
        (sum, payment) => sum + (Number(payment.amount) || 0), 
        0
      ) || 0;

      analytics.summary = {
        ...analytics.summary,
        total_revenue: totalRevenue,
        payment_count: revenueData?.length || 0,
        average_payment: revenueData?.length 
          ? totalRevenue / revenueData.length 
          : 0,
      };

      // Revenue trends by period
      analytics.trends = {
        ...analytics.trends,
        revenue_by_period: groupDataByPeriod(revenueData, period, 'amount'),
      };
    }

    // Order Analytics
    if (!metric || metric === 'orders') {
      const { data: orderData } = await supabase
        .from('orders')
        .select(`
          id, 
          order_number, 
          total_amount, 
          currency, 
          status, 
          created_at,
          order_items(id, quantity, price, subtotal)
        `)
        .gte('created_at', startIso)
        .lte('created_at', endIso)
        .order('created_at', { ascending: true });

      const totalOrders = orderData?.length || 0;
      const totalOrderValue = orderData?.reduce(
        (sum, order) => sum + (Number(order.total_amount) || 0), 
        0
      ) || 0;

      const totalItems = orderData?.reduce(
        (sum, order) => sum + (order.order_items?.reduce(
          (itemSum, item) => itemSum + (Number(item.quantity) || 0), 
          0
        ) || 0), 
        0
      ) || 0;

      analytics.summary = {
        ...analytics.summary,
        total_orders: totalOrders,
        total_order_value: totalOrderValue,
        average_order_value: totalOrders ? totalOrderValue / totalOrders : 0,
        total_items_sold: totalItems,
        average_items_per_order: totalOrders ? totalItems / totalOrders : 0,
      };

      analytics.trends = {
        ...analytics.trends,
        orders_by_period: groupDataByPeriod(orderData, period, 'total_amount', 'count'),
        order_value_by_period: groupDataByPeriod(orderData, period, 'total_amount'),
      };

      // Order status breakdown
      const statusBreakdown = orderData?.reduce((acc, order) => {
        const status = order.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      analytics.insights = {
        ...analytics.insights,
        order_status_breakdown: statusBreakdown,
      };
    }

    // Customer Analytics
    if (!metric || metric === 'customers') {
      const { data: customerData } = await supabase
        .from('profiles')
        .select('id, created_at, role')
        .eq('role', 'customer')
        .gte('created_at', startIso)
        .lte('created_at', endIso)
        .order('created_at', { ascending: true });

      analytics.summary = {
        ...analytics.summary,
        new_customers: customerData?.length || 0,
      };

      analytics.trends = {
        ...analytics.trends,
        customers_by_period: groupDataByPeriod(customerData, period, null, 'count'),
      };

      // Customer lifetime value (simplified - orders per customer)
      const { data: customerOrders } = await supabase
        .from('orders')
        .select('user_id, total_amount, created_at')
        .gte('created_at', startIso)
        .lte('created_at', endIso);

      const customerMetrics = customerOrders?.reduce((acc, order) => {
        const userId = order.user_id || 'guest';
        if (!acc[userId]) {
          acc[userId] = { orders: 0, total_spent: 0 };
        }
        acc[userId].orders += 1;
        acc[userId].total_spent += Number(order.total_amount) || 0;
        return acc;
      }, {} as Record<string, { orders: number; total_spent: number }>) || {};

      const customerValues = Object.values(customerMetrics);
      const avgOrdersPerCustomer = customerValues.length 
        ? customerValues.reduce((sum, c) => sum + c.orders, 0) / customerValues.length 
        : 0;
      const avgLifetimeValue = customerValues.length 
        ? customerValues.reduce((sum, c) => sum + c.total_spent, 0) / customerValues.length 
        : 0;

      analytics.insights = {
        ...analytics.insights,
        average_orders_per_customer: avgOrdersPerCustomer,
        average_customer_lifetime_value: avgLifetimeValue,
      };
    }

    // Product Analytics
    if (!metric || metric === 'products') {
      let productQuery = supabase
        .from('order_items')
        .select(`
          product_id,
          product_name,
          variant_id,
          variant_name,
          quantity,
          price,
          subtotal,
          orders!inner(created_at, status)
        `)
        .gte('orders.created_at', startIso)
        .lte('orders.created_at', endIso)
        .eq('orders.status', 'completed');

      if (category_id) {
        productQuery = productQuery.eq('products.category_id', category_id);
      }

      const { data: productSales } = await productQuery
        .order('quantity', { ascending: false })
        .limit(limit);

      // Aggregate product performance
      const productMetrics = productSales?.reduce((acc, item) => {
        const productId = item.product_id;
        if (!acc[productId]) {
          acc[productId] = {
            product_id: productId,
            product_name: item.product_name,
            total_quantity: 0,
            total_revenue: 0,
            order_count: 0,
          };
        }
        acc[productId].total_quantity += Number(item.quantity) || 0;
        acc[productId].total_revenue += Number(item.subtotal) || 0;
        acc[productId].order_count += 1;
        return acc;
      }, {} as Record<string, any>) || {};

      const topProducts = Object.values(productMetrics)
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, 10);

      analytics.insights = {
        ...analytics.insights,
        top_products_by_revenue: topProducts,
        top_products_by_quantity: Object.values(productMetrics)
          .sort((a, b) => b.total_quantity - a.total_quantity)
          .slice(0, 10),
      };
    }

    // Date range info
    analytics.summary = {
      ...analytics.summary,
      date_range: {
        start_date: startIso,
        end_date: endIso,
        period,
        days: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
      },
    };

    return NextResponse.json({
      success: true,
      data: analytics,
    });

  } catch (error) {
    console.error('Analytics API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}

// Helper function to group data by time period
function groupDataByPeriod(
  data: any[], 
  period: 'day' | 'week' | 'month' | 'quarter' | 'year',
  valueField?: string | null,
  aggregation: 'sum' | 'count' = 'sum'
) {
  if (!data) return [];

  const grouped = data.reduce((acc, item) => {
    const date = new Date(item.created_at);
    let key: string;

    switch (period) {
      case 'day':
        key = date.toISOString().split('T')[0]; // YYYY-MM-DD
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        break;
      case 'quarter':
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        key = `${date.getFullYear()}-Q${quarter}`;
        break;
      case 'year':
        key = date.getFullYear().toString();
        break;
      default:
        key = date.toISOString().split('T')[0];
    }

    if (!acc[key]) {
      acc[key] = { period: key, value: 0, count: 0 };
    }

    if (aggregation === 'count') {
      acc[key].count += 1;
      acc[key].value = acc[key].count;
    } else if (valueField) {
      acc[key].value += Number(item[valueField]) || 0;
      acc[key].count += 1;
    } else {
      acc[key].count += 1;
      acc[key].value = acc[key].count;
    }

    return acc;
  }, {} as Record<string, { period: string; value: number; count: number }>);

  return Object.values(grouped).sort((a, b) => a.period.localeCompare(b.period));
}
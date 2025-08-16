import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Customer acquisition metrics
    const { data: newCustomers } = await supabase
      .from('profiles')
      .select('id, created_at')
      .eq('role', 'customer')
      .gte('created_at', thirtyDaysAgo.toISOString());

    const { data: previousPeriodCustomers } = await supabase
      .from('profiles')
      .select('id, created_at')
      .eq('role', 'customer')
      .gte('created_at', sixtyDaysAgo.toISOString())
      .lt('created_at', thirtyDaysAgo.toISOString());

    // Customer lifetime value analysis
    const { data: customerOrders } = await supabase
      .from('orders')
      .select('user_id, total_amount, created_at, status')
      .in('status', ['completed', 'processing']);

    const customerMetrics = customerOrders?.reduce((acc, order) => {
      const userId = order.user_id || 'guest';
      if (!acc[userId]) {
        acc[userId] = { 
          orders: 0, 
          total_spent: 0, 
          first_order: order.created_at,
          last_order: order.created_at 
        };
      }
      acc[userId].orders += 1;
      acc[userId].total_spent += Number(order.total_amount);
      if (order.created_at < acc[userId].first_order) {
        acc[userId].first_order = order.created_at;
      }
      if (order.created_at > acc[userId].last_order) {
        acc[userId].last_order = order.created_at;
      }
      return acc;
    }, {} as Record<string, any>) || {};

    const customerValues = Object.values(customerMetrics);
    const avgLTV = customerValues.length 
      ? customerValues.reduce((sum: number, c: any) => sum + c.total_spent, 0) / customerValues.length 
      : 0;

    // Customer segmentation
    const segments = {
      high_value: customerValues.filter((c: any) => c.total_spent > avgLTV * 2).length,
      regular: customerValues.filter((c: any) => c.total_spent <= avgLTV * 2 && c.total_spent >= avgLTV * 0.5).length,
      low_value: customerValues.filter((c: any) => c.total_spent < avgLTV * 0.5).length
    };

    // Repeat customers
    const repeatCustomers = customerValues.filter((c: any) => c.orders > 1).length;
    const retentionRate = customerValues.length ? (repeatCustomers / customerValues.length) * 100 : 0;

    // Recent activity (customers with orders in last 30 days)
    const { data: recentOrders } = await supabase
      .from('orders')
      .select('user_id')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .in('status', ['completed', 'processing']);

    const activeCustomers = new Set(recentOrders?.map(o => o.user_id)).size;

    // Churn analysis (customers who haven't ordered in 60+ days)
    const allCustomerIds = new Set(customerValues.map((c: any, i: number) => Object.keys(customerMetrics)[i]));
    const recentCustomerIds = new Set(recentOrders?.map(o => o.user_id));
    const churnedCustomers = allCustomerIds.size - recentCustomerIds.size;
    const churnRate = allCustomerIds.size ? (churnedCustomers / allCustomerIds.size) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        acquisition: {
          new_customers_30d: newCustomers?.length || 0,
          previous_period: previousPeriodCustomers?.length || 0,
          growth_rate: previousPeriodCustomers?.length 
            ? ((newCustomers?.length || 0) - previousPeriodCustomers.length) / previousPeriodCustomers.length * 100
            : 0
        },
        retention: {
          total_customers: customerValues.length,
          repeat_customers: repeatCustomers,
          retention_rate: retentionRate,
          active_customers_30d: activeCustomers,
          churn_rate: churnRate
        },
        value: {
          average_ltv: avgLTV,
          total_orders: customerValues.reduce((sum: number, c: any) => sum + c.orders, 0),
          avg_orders_per_customer: customerValues.length 
            ? customerValues.reduce((sum: number, c: any) => sum + c.orders, 0) / customerValues.length 
            : 0
        },
        segmentation: segments
      }
    });

  } catch (error) {
    console.error('Customer analytics error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customer analytics' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAdmin } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/server';

const customersQuerySchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  period: z.enum(['day', 'week', 'month', 'quarter', 'year']).default('month'),
  segment: z.enum(['all', 'new', 'returning', 'high_value', 'at_risk']).default('all'),
  min_orders: z.coerce.number().min(0).default(0),
  min_spend: z.coerce.number().min(0).default(0),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedParams = customersQuerySchema.parse(queryParams);
    
    const { start_date, end_date, period, segment, min_orders, min_spend } = validatedParams;

    const supabase = await createClient();

    // Set default date range (last 30 days)
    const endDate = end_date ? new Date(end_date) : new Date();
    const startDate = start_date 
      ? new Date(start_date) 
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const startIso = startDate.toISOString();
    const endIso = endDate.toISOString();

    // Get customer data with their order history
    const { data: customers } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        created_at,
        role,
        orders(
          id,
          total_amount,
          currency,
          status,
          created_at,
          order_items(quantity, subtotal)
        ),
        addresses(
          id,
          country_code,
          city,
          type
        )
      `)
      .eq('role', 'customer');

    if (!customers) {
      return NextResponse.json({
        success: true,
        data: {
          summary: {},
          acquisition: [],
          segments: {},
          insights: {},
        }
      });
    }

    // Calculate customer metrics
    const customerMetrics = customers.map(customer => {
      const orders = customer.orders || [];
      const completedOrders = orders.filter(order => 
        ['completed', 'shipped', 'delivered'].includes(order.status || '')
      );
      
      const ordersInPeriod = completedOrders.filter(order => 
        order.created_at >= startIso && order.created_at <= endIso
      );

      const totalSpent = completedOrders.reduce(
        (sum, order) => sum + (Number(order.total_amount) || 0), 0
      );
      
      const spentInPeriod = ordersInPeriod.reduce(
        (sum, order) => sum + (Number(order.total_amount) || 0), 0
      );

      const totalItems = completedOrders.reduce((sum, order) => 
        sum + (order.order_items?.reduce((itemSum, item) => 
          itemSum + (Number(item.quantity) || 0), 0
        ) || 0), 0
      );

      const firstOrderDate = completedOrders.length > 0 
        ? new Date(Math.min(...completedOrders.map(o => new Date(o.created_at).getTime())))
        : null;

      const lastOrderDate = completedOrders.length > 0 
        ? new Date(Math.max(...completedOrders.map(o => new Date(o.created_at).getTime())))
        : null;

      // Customer lifetime in days
      const lifetimeDays = firstOrderDate && lastOrderDate 
        ? Math.ceil((lastOrderDate.getTime() - firstOrderDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      // Recency (days since last order)
      const daysSinceLastOrder = lastOrderDate 
        ? Math.ceil((new Date().getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      // Customer acquisition date
      const isNewCustomer = new Date(customer.created_at) >= new Date(startIso);

      // Geographic info
      const addresses = customer.addresses || [];
      const countries = [...new Set(addresses.map(addr => addr.country_code).filter(Boolean))];

      return {
        customer_id: customer.id,
        full_name: customer.full_name,
        created_at: customer.created_at,
        is_new_customer: isNewCustomer,
        total_orders: completedOrders.length,
        orders_in_period: ordersInPeriod.length,
        total_spent: totalSpent,
        spent_in_period: spentInPeriod,
        total_items: totalItems,
        average_order_value: completedOrders.length ? totalSpent / completedOrders.length : 0,
        first_order_date: firstOrderDate?.toISOString() || null,
        last_order_date: lastOrderDate?.toISOString() || null,
        lifetime_days: lifetimeDays,
        days_since_last_order: daysSinceLastOrder,
        countries,
        frequency: lifetimeDays > 0 ? completedOrders.length / (lifetimeDays / 30) : 0, // orders per month
      };
    });

    // Apply filters
    const filteredCustomers = customerMetrics.filter(customer => {
      if (customer.total_orders < min_orders) return false;
      if (customer.total_spent < min_spend) return false;
      
      switch (segment) {
        case 'new':
          return customer.is_new_customer;
        case 'returning':
          return customer.total_orders > 1;
        case 'high_value':
          return customer.total_spent > 500; // Configurable threshold
        case 'at_risk':
          return customer.days_since_last_order !== null && customer.days_since_last_order > 60;
        default:
          return true;
      }
    });

    // Customer acquisition trends
    const acquisitionTrends = groupCustomersByPeriod(
      customers.filter(c => new Date(c.created_at) >= new Date(startIso)), 
      period
    );

    // Customer segments
    const segments = {
      new_customers: customerMetrics.filter(c => c.is_new_customer).length,
      returning_customers: customerMetrics.filter(c => c.total_orders > 1).length,
      high_value_customers: customerMetrics.filter(c => c.total_spent > 500).length,
      at_risk_customers: customerMetrics.filter(c => 
        c.days_since_last_order !== null && c.days_since_last_order > 60
      ).length,
      single_purchase: customerMetrics.filter(c => c.total_orders === 1).length,
      repeat_customers: customerMetrics.filter(c => c.total_orders >= 2).length,
      loyal_customers: customerMetrics.filter(c => c.total_orders >= 5).length,
    };

    // Geographic breakdown
    const geographicBreakdown = customerMetrics.reduce((acc, customer) => {
      customer.countries.forEach(country => {
        if (!acc[country]) {
          acc[country] = {
            country_code: country,
            customer_count: 0,
            total_spent: 0,
            total_orders: 0,
          };
        }
        acc[country].customer_count += 1;
        acc[country].total_spent += customer.total_spent;
        acc[country].total_orders += customer.total_orders;
      });
      return acc;
    }, {} as Record<string, any>);

    // Summary metrics
    const totalCustomers = filteredCustomers.length;
    const totalLifetimeValue = filteredCustomers.reduce((sum, c) => sum + c.total_spent, 0);
    const averageLifetimeValue = totalCustomers ? totalLifetimeValue / totalCustomers : 0;
    const averageOrdersPerCustomer = totalCustomers 
      ? filteredCustomers.reduce((sum, c) => sum + c.total_orders, 0) / totalCustomers 
      : 0;

    // Customer retention analysis
    const retentionRate = customerMetrics.length 
      ? (customerMetrics.filter(c => c.total_orders > 1).length / customerMetrics.length) * 100 
      : 0;

    // Top customers
    const topCustomers = filteredCustomers
      .sort((a, b) => b.total_spent - a.total_spent)
      .slice(0, 10)
      .map(customer => ({
        customer_id: customer.customer_id,
        full_name: customer.full_name,
        total_spent: customer.total_spent,
        total_orders: customer.total_orders,
        average_order_value: customer.average_order_value,
        last_order_date: customer.last_order_date,
      }));

    // Insights
    const insights = {
      highest_spender: topCustomers[0] || null,
      most_frequent: filteredCustomers.sort((a, b) => b.total_orders - a.total_orders)[0] || null,
      newest_customer: filteredCustomers
        .filter(c => c.is_new_customer)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] || null,
      churn_risk_count: segments.at_risk_customers,
      acquisition_rate: acquisitionTrends.length 
        ? acquisitionTrends[acquisitionTrends.length - 1]?.value || 0 
        : 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          total_customers: totalCustomers,
          average_lifetime_value: averageLifetimeValue,
          average_orders_per_customer: averageOrdersPerCustomer,
          retention_rate: retentionRate,
          date_range: {
            start_date: startIso,
            end_date: endIso,
            period,
            days: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
          },
        },
        acquisition: acquisitionTrends,
        segments,
        geographic_breakdown: Object.values(geographicBreakdown)
          .sort((a: any, b: any) => b.total_spent - a.total_spent),
        top_customers: topCustomers,
        insights,
        metadata: {
          segment,
          min_orders,
          min_spend,
          filtered_count: filteredCustomers.length,
          total_count: customerMetrics.length,
        },
      },
    });

  } catch (error) {
    console.error('Customers analytics error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customers analytics' },
      { status: 500 }
    );
  }
}

function groupCustomersByPeriod(
  customers: any[], 
  period: 'day' | 'week' | 'month' | 'quarter' | 'year'
) {
  const grouped = customers.reduce((acc, customer) => {
    const date = new Date(customer.created_at);
    let key: string;

    switch (period) {
      case 'day':
        key = date.toISOString().split('T')[0];
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
      acc[key] = { 
        period: key, 
        value: 0,
      };
    }

    acc[key].value += 1;

    return acc;
  }, {} as Record<string, { period: string; value: number }>);

  return Object.values(grouped).sort((a, b) => a.period.localeCompare(b.period));
}
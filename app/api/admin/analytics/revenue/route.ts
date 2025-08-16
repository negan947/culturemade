import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAdmin } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/server';

const revenueQuerySchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  period: z.enum(['hour', 'day', 'week', 'month', 'quarter', 'year']).default('day'),
  currency: z.string().optional(),
  compare_period: z.boolean().default(false),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedParams = revenueQuerySchema.parse(queryParams);
    
    const { start_date, end_date, period, currency, compare_period } = validatedParams;

    const supabase = await createClient();

    // Set default date range (last 30 days)
    const endDate = end_date ? new Date(end_date) : new Date();
    const startDate = start_date 
      ? new Date(start_date) 
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const startIso = startDate.toISOString();
    const endIso = endDate.toISOString();

    // Base query for revenue data
    let revenueQuery = supabase
      .from('payments')
      .select(`
        amount,
        currency,
        created_at,
        status,
        method,
        orders!inner(id, order_number, total_amount, user_id)
      `)
      .eq('status', 'succeeded')
      .gte('created_at', startIso)
      .lte('created_at', endIso);

    if (currency) {
      revenueQuery = revenueQuery.eq('currency', currency);
    }

    const { data: revenueData } = await revenueQuery
      .order('created_at', { ascending: true });

    if (!revenueData) {
      return NextResponse.json({
        success: true,
        data: {
          summary: {},
          trends: [],
          breakdown: {},
        }
      });
    }

    // Calculate summary metrics
    const totalRevenue = revenueData.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
    const paymentCount = revenueData.length;
    const averagePayment = paymentCount ? totalRevenue / paymentCount : 0;

    // Group by payment method
    const methodBreakdown = revenueData.reduce((acc, payment) => {
      const method = payment.method || 'unknown';
      acc[method] = (acc[method] || 0) + (Number(payment.amount) || 0);
      return acc;
    }, {} as Record<string, number>);

    // Group by currency
    const currencyBreakdown = revenueData.reduce((acc, payment) => {
      const curr = payment.currency || 'USD';
      if (!acc[curr]) {
        acc[curr] = { count: 0, total: 0 };
      }
      acc[curr].count += 1;
      acc[curr].total += Number(payment.amount) || 0;
      return acc;
    }, {} as Record<string, { count: number; total: number }>);

    // Time-based trends
    const trends = groupRevenueByPeriod(revenueData, period);

    // Comparison period (if requested)
    let comparisonData = null;
    if (compare_period) {
      const periodLength = endDate.getTime() - startDate.getTime();
      const compareEndDate = new Date(startDate.getTime() - 1);
      const compareStartDate = new Date(compareEndDate.getTime() - periodLength);

      const { data: compareRevenueData } = await supabase
        .from('payments')
        .select('amount, currency, created_at, status')
        .eq('status', 'succeeded')
        .gte('created_at', compareStartDate.toISOString())
        .lte('created_at', compareEndDate.toISOString());

      if (compareRevenueData) {
        const compareTotal = compareRevenueData.reduce(
          (sum, payment) => sum + (Number(payment.amount) || 0), 0
        );
        const compareCount = compareRevenueData.length;
        
        comparisonData = {
          total_revenue: compareTotal,
          payment_count: compareCount,
          average_payment: compareCount ? compareTotal / compareCount : 0,
          growth_rate: compareTotal ? ((totalRevenue - compareTotal) / compareTotal) * 100 : 0,
          growth_absolute: totalRevenue - compareTotal,
        };
      }
    }

    // Revenue by customer type (authenticated vs guest)
    const customerTypeBreakdown = revenueData.reduce((acc, payment) => {
      const type = payment.orders?.user_id ? 'authenticated' : 'guest';
      acc[type] = (acc[type] || 0) + (Number(payment.amount) || 0);
      return acc;
    }, {} as Record<string, number>);

    // Top revenue days
    const dailyRevenue = groupRevenueByPeriod(revenueData, 'day');
    const topDays = dailyRevenue
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          total_revenue: totalRevenue,
          payment_count: paymentCount,
          average_payment: averagePayment,
          date_range: {
            start_date: startIso,
            end_date: endIso,
            period,
            days: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
          },
        },
        trends,
        breakdown: {
          by_method: methodBreakdown,
          by_currency: currencyBreakdown,
          by_customer_type: customerTypeBreakdown,
        },
        insights: {
          top_revenue_days: topDays,
          peak_day: topDays[0] || null,
          lowest_day: dailyRevenue.length ? dailyRevenue.sort((a, b) => a.value - b.value)[0] : null,
        },
        comparison: comparisonData,
      },
    });

  } catch (error) {
    console.error('Revenue analytics error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch revenue analytics' },
      { status: 500 }
    );
  }
}

function groupRevenueByPeriod(
  data: any[], 
  period: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year'
) {
  const grouped = data.reduce((acc, payment) => {
    const date = new Date(payment.created_at);
    let key: string;

    switch (period) {
      case 'hour':
        key = `${date.toISOString().split('T')[0]} ${date.getHours().toString().padStart(2, '0')}:00`;
        break;
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
        count: 0,
        average: 0,
      };
    }

    acc[key].value += Number(payment.amount) || 0;
    acc[key].count += 1;
    acc[key].average = acc[key].value / acc[key].count;

    return acc;
  }, {} as Record<string, { period: string; value: number; count: number; average: number }>);

  return Object.values(grouped).sort((a, b) => a.period.localeCompare(b.period));
}
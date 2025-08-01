import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

export interface CustomerListItem {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  registered_at: string;
  order_count: number;
  total_spent: number;
  last_order_date: string | null;
  status: 'active' | 'inactive' | 'blocked';
}

export interface CustomerListResponse {
  customers: CustomerListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

async function requireAdmin() {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    throw new Error('Forbidden - Admin access required');
  }

  return { user, supabase };
}

export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await requireAdmin();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';

    const offset = (page - 1) * limit;

    // Build base query with filters
    let profilesQuery = supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        phone,
        role,
        created_at
      `);

    // Add search filter
    if (search) {
      profilesQuery = profilesQuery.or(`full_name.ilike.%${search}%,phone.like.%${search}%`);
    }

    // Add role filter
    if (role && role !== 'all') {
      profilesQuery = profilesQuery.eq('role', role);
    }

    // Add status filter
    if (status && status !== 'all') {
      if (status === 'blocked') {
        profilesQuery = profilesQuery.eq('role', 'blocked');
      } else if (status === 'inactive') {
        profilesQuery = profilesQuery.eq('role', 'inactive');
      } else if (status === 'active') {
        profilesQuery = profilesQuery.not('role', 'in', '(blocked,inactive)');
      }
    }

    // Get total count for pagination (use a separate query)
    const { count: total, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Count query error:', countError);
      return NextResponse.json({ error: 'Failed to get customer count' }, { status: 500 });
    }

    // Get profiles with pagination
    const { data: profiles, error: profilesError } = await profilesQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (profilesError) {
      console.error('Profiles query error:', profilesError);
      return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
    }

    // Get user emails for these profiles
    const profileIds = profiles?.map(p => p.id) || [];
    
    let customers: CustomerListItem[] = [];
    
    if (profileIds.length > 0) {
      // Get auth users data - using a different approach since admin.listUsers() might not be available
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error('Auth users query error:', authError);
        // Fallback: create dummy customers with profile data only
        customers = profiles.map(profile => ({
          id: profile.id,
          email: '', // We'll leave email empty for now
          full_name: profile.full_name,
          phone: profile.phone,
          role: profile.role || 'customer',
          registered_at: profile.created_at,
          order_count: 0,
          total_spent: 0,
          last_order_date: null,
          status: (profile.role === 'blocked' ? 'blocked' : 
                   profile.role === 'inactive' ? 'inactive' : 'active') as 'active' | 'inactive' | 'blocked'
        }));
      } else {
        // Get order counts and totals for these users
        const { data: orderStats, error: orderError } = await supabase
          .from('orders')
          .select('user_id, status, total_amount, created_at')
          .in('user_id', profileIds);

        if (orderError) {
          console.error('Orders query error:', orderError);
          // Continue without order data
        }

        // Combine data
        customers = profiles.map(profile => {
          const authUser = authUsers.users.find(u => u.id === profile.id);
          const userOrders = orderStats?.filter(o => o.user_id === profile.id) || [];
          const completedOrders = userOrders.filter(o => o.status === 'completed');
          
          return {
            id: profile.id,
            email: authUser?.email || '',
            full_name: profile.full_name,
            phone: profile.phone,
            role: profile.role || 'customer',
            registered_at: profile.created_at,
            order_count: userOrders.length,
            total_spent: completedOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0),
            last_order_date: userOrders.length > 0 
              ? userOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]?.created_at || null
              : null,
            status: (profile.role === 'blocked' ? 'blocked' : 
                     profile.role === 'inactive' ? 'inactive' : 'active') as 'active' | 'inactive' | 'blocked'
          };
        });

        // Apply email search filter if needed (since we couldn't filter by email in the initial query)
        if (search) {
          customers = customers.filter(customer => 
            customer.email.toLowerCase().includes(search.toLowerCase()) ||
            customer.full_name?.toLowerCase().includes(search.toLowerCase()) ||
            customer.phone?.includes(search)
          );
        }
      }
    }


    // Log admin action
    await supabase.from('admin_logs').insert({
      admin_id: user.id,
      action: 'customers_list_viewed',
      resource_type: 'customers',
      metadata: {
        page,
        limit,
        search,
        role,
        status,
        total_results: total
      }
    });

    const response: CustomerListResponse = {
      customers,
      pagination: {
        page,
        limit,
        total: total || 0,
        totalPages: Math.ceil((total || 0) / limit)
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Admin customers API error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message === 'Forbidden - Admin access required') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
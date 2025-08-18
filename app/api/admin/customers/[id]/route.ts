import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export interface CustomerDetail {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  avatar_url: string | null;
  registered_at: string;
  updated_at: string | null;
  order_count: number;
  total_spent: number;
  last_order_date: string | null;
  status: 'active' | 'inactive' | 'blocked';
  addresses: CustomerAddress[];
  recent_orders: RecentOrder[];
}

export interface CustomerAddress {
  id: string;
  type: 'billing' | 'shipping';
  first_name: string;
  last_name: string;
  company?: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

export interface RecentOrder {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  item_count: number;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    // Verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!adminProfile || adminProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const customerId = params.id;

    // Get customer profile first
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', customerId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Get order statistics
    const { data: orderStats, error: orderError } = await supabase
      .from('orders')
      .select('total_amount, status, created_at')
      .eq('user_id', customerId);

    const orderCount = orderStats?.length || 0;
    const totalSpent = orderStats
      ?.filter(order => order.status === 'completed')
      ?.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0) || 0;
    const lastOrderDate = orderStats?.length > 0 
      ? new Date(Math.max(...orderStats.map(order => new Date(order.created_at).getTime()))).toISOString()
      : null;

    // Get user email from auth using admin client
    const adminSupabase = createAdminClient();
    const { data: authUser, error: authUserError } = await adminSupabase.auth.admin.getUserById(customerId);
    
    const customer = {
      id: profile.id,
      email: authUser?.user?.email || '',
      full_name: profile.full_name,
      phone: profile.phone,
      role: profile.role || 'customer',
      avatar_url: profile.avatar_url,
      registered_at: profile.created_at,
      updated_at: profile.updated_at,
      order_count: orderCount,
      total_spent: totalSpent,
      last_order_date: lastOrderDate,
      status: profile.role === 'blocked' ? 'blocked' : 
               profile.role === 'inactive' ? 'inactive' : 'active'
    };

    // Get customer addresses
    const { data: addresses, error: addressError } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', customerId)
      .order('is_default', { ascending: false });

    if (addressError) {
      // Address query failed, continue without addresses
    }

    // Get recent orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        total_amount,
        created_at,
        order_items(id)
      `)
      .eq('user_id', customerId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (ordersError) {
    }

    // Transform data
    const customerDetail: CustomerDetail = {
      id: customer.id,
      email: customer.email || '',
      full_name: customer.full_name,
      phone: customer.phone,
      role: customer.role || 'customer',
      avatar_url: customer.avatar_url,
      registered_at: customer.registered_at,
      updated_at: customer.updated_at,
      order_count: parseInt(customer.order_count) || 0,
      total_spent: parseFloat(customer.total_spent) || 0,
      last_order_date: customer.last_order_date,
      status: customer.status || 'active',
      addresses: (addresses || []).map((addr: any) => ({
        id: addr.id,
        type: addr.type || 'shipping',
        first_name: addr.first_name || '',
        last_name: addr.last_name || '',
        company: addr.company,
        address_line_1: addr.address_line_1 || '',
        address_line_2: addr.address_line_2,
        city: addr.city || '',
        state: addr.state || '',
        postal_code: addr.postal_code || '',
        country: addr.country || '',
        is_default: addr.is_default || false
      })),
      recent_orders: (orders || []).map((order: any) => ({
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        total_amount: parseFloat(order.total_amount) || 0,
        created_at: order.created_at,
        item_count: order.order_items?.length || 0
      }))
    };

    // Log admin action
    await supabase.from('admin_logs').insert({
      admin_id: user.id,
      action: 'customer_detail_viewed',
      resource_type: 'customers',
      resource_id: customerId,
      metadata: {
        customer_email: customer.email,
        customer_role: customer.role
      }
    });

    return NextResponse.json(customerDetail);

  } catch (error: any) {
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Forbidden - Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Validation schema for customer updates
const updateCustomerSchema = z.object({
  full_name: z.string().max(255).optional(),
  phone: z.string().max(50).optional(),
  role: z.enum(['customer', 'admin', 'inactive', 'blocked']),
  old_values: z.object({
    full_name: z.string().nullable(),
    phone: z.string().nullable(),
    role: z.string()
  }).optional()
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    // Verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!adminProfile || adminProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const customerId = params.id;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateCustomerSchema.parse(body);

    // Check if customer exists
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, phone, role')
      .eq('id', customerId)
      .single();

    if (profileError || !existingProfile) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {};
    if (validatedData.full_name !== undefined) {
      updateData.full_name = validatedData.full_name;
    }
    if (validatedData.phone !== undefined) {
      updateData.phone = validatedData.phone;
    }
    if (validatedData.role !== undefined) {
      updateData.role = validatedData.role;
    }
    updateData.updated_at = new Date().toISOString();

    // Update customer profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', customerId);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
    }

    // Log admin action with change details
    const changes = {
      before: validatedData.old_values || existingProfile,
      after: {
        full_name: validatedData.full_name ?? existingProfile.full_name,
        phone: validatedData.phone ?? existingProfile.phone,
        role: validatedData.role ?? existingProfile.role
      }
    };

    await supabase.from('admin_logs').insert({
      admin_id: user.id,
      action: 'customer_updated',
      resource_type: 'customers',
      resource_id: customerId,
      metadata: {
        changes,
        updated_fields: Object.keys(updateData).filter(key => key !== 'updated_at')
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Customer updated successfully' 
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: error.errors 
      }, { status: 400 });
    }
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Forbidden - Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

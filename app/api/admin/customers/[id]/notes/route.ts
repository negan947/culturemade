import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';

export interface CustomerNote {
  id: string;
  customer_id: string;
  admin_id: string;
  admin_name: string;
  note: string;
  created_at: string;
  updated_at: string;
}

// Validation schema for creating/updating notes
const noteSchema = z.object({
  note: z.string().min(1, 'Note cannot be empty').max(2000, 'Note cannot exceed 2000 characters')
});

async function requireAdmin() {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    throw new Error('Forbidden - Admin access required');
  }

  return { user, supabase, adminName: profile.full_name || 'Admin' };
}

// GET /api/admin/customers/[id]/notes - Get all notes for a customer
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, supabase } = await requireAdmin();
    const customerId = params.id;

    // Get customer notes with admin names
    const { data: notes, error: notesError } = await supabase
      .from('customer_notes')
      .select(`
        id,
        customer_id,
        admin_id,
        note,
        created_at,
        updated_at,
        profiles:admin_id(full_name)
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (notesError) {
      return NextResponse.json({ error: 'Failed to fetch customer notes' }, { status: 500 });
    }

    const formattedNotes: CustomerNote[] = (notes || []).map((note: any) => ({
      id: note.id,
      customer_id: note.customer_id,
      admin_id: note.admin_id,
      admin_name: note.profiles?.full_name || 'Admin',
      note: note.note,
      created_at: note.created_at,
      updated_at: note.updated_at
    }));

    // Log admin action
    await supabase.from('admin_logs').insert({
      admin_id: user.id,
      action: 'customer_notes_viewed',
      resource_type: 'customers',
      resource_id: customerId,
      metadata: {
        notes_count: formattedNotes.length
      }
    });

    return NextResponse.json({ notes: formattedNotes });

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

// POST /api/admin/customers/[id]/notes - Create a new note for a customer
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, supabase, adminName } = await requireAdmin();
    const customerId = params.id;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = noteSchema.parse(body);

    // Check if customer exists
    const { data: customerExists, error: customerError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', customerId)
      .single();

    if (customerError || !customerExists) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Create the note
    const { data: note, error: noteError } = await supabase
      .from('customer_notes')
      .insert({
        customer_id: customerId,
        admin_id: user.id,
        note: validatedData.note
      })
      .select()
      .single();

    if (noteError) {
      return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
    }

    // Log admin action
    await supabase.from('admin_logs').insert({
      admin_id: user.id,
      action: 'customer_note_created',
      resource_type: 'customers',
      resource_id: customerId,
      metadata: {
        note_id: note.id,
        note_length: validatedData.note.length
      }
    });

    const formattedNote: CustomerNote = {
      id: note.id,
      customer_id: note.customer_id,
      admin_id: note.admin_id,
      admin_name: adminName,
      note: note.note,
      created_at: note.created_at,
      updated_at: note.updated_at
    };

    return NextResponse.json({ 
      note: formattedNote,
      message: 'Note created successfully' 
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
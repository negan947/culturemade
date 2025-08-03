/**
 * Analytics Events API Route - Track user interactions and behavior
 */

import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/analytics/events - Store analytics events
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { events, session_id } = body;

    if (!events || !Array.isArray(events)) {
      return NextResponse.json(
        { error: 'Events array is required' },
        { status: 400 }
      );
    }

    if (events.length === 0) {
      return NextResponse.json({ success: true, message: 'No events to process' });
    }

    const supabase = await createClient();

    // Transform events for database insertion
    const eventsToInsert = events.map((event: any) => ({
      event_type: event.event_type,
      event_data: event.event_data || {},
      product_id: event.product_id || null,
      user_id: event.user_id || null,
      session_id: session_id || event.session_id || null,
      created_at: event.created_at || new Date().toISOString(),
      user_agent: event.user_agent || null,
      page_url: event.page_url || null,
      referrer: event.referrer || null
    }));

    // Insert events into analytics_events table
    const { data, error } = await supabase
      .from('analytics_events')
      .insert(eventsToInsert)
      .select();

    if (error) {
      console.error('Analytics insert error:', error);
      return NextResponse.json(
        { error: 'Failed to store analytics events', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully stored ${events.length} analytics events`,
      events_stored: data?.length || 0
    });

  } catch (error: any) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to process analytics events', details: error.message },
      { status: 500 }
    );
  }
}
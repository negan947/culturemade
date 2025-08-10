/**
 * Analytics Events API Route - Track user interactions and behavior
 */

import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/supabase/auth';

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
    const { user } = await getUser();

    // Transform events to match public.analytics_events schema
    // Table columns: event_name, user_id, session_id, properties, created_at
    const eventsToInsert = events.map((event: any) => ({
      event_name: String(event.event_type || event.event_name || 'event'),
      user_id: event.user_id || user?.id || null,
      session_id: session_id || event.session_id || null,
      properties: {
        product_id: event.product_id || null,
        event_data: event.event_data || {},
        source_component: event.source_component || null,
        position_index: event.position_index ?? null,
        search_query: event.search_query || null,
        category_id: event.category_id || null,
        user_agent: event.user_agent || (typeof navigator !== 'undefined' ? navigator.userAgent : null),
        page_url: event.page_url || (typeof location !== 'undefined' ? location.href : null),
        referrer: event.referrer || (typeof document !== 'undefined' ? document.referrer : null)
      },
      created_at: event.created_at || new Date().toISOString(),
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
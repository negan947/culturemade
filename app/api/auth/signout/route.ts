import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { logSecurityEvent } from '@/lib/utils/security';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user for logging
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Sign out
    const { error } = await supabase.auth.signOut();

    if (error) {
      logSecurityEvent('SIGN_OUT_ERROR', { error: error.message });
      return NextResponse.json(
        { error: 'Failed to sign out' },
        { status: 500 }
      );
    }

    // Log successful sign out
    if (user) {
      logSecurityEvent('USER_SIGNED_OUT', { userId: user.id });
    }

    // Redirect to login page
    return NextResponse.redirect(new URL('/login', request.url));
  } catch (error) {
    logSecurityEvent('SIGN_OUT_UNEXPECTED_ERROR', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

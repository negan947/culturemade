import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import {
  authLogger,
  errorLogger,
  logAuthEvent,
  logDatabaseQuery,
} from '@/lib/utils/logger';

// Sentry utilities removed

async function handleAuthCallback(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/';

  // Log the auth callback start
  authLogger.info('Processing auth callback', {
    hasCode: !!code,
    nextUrl: next,
    userAgent: request.headers.get('user-agent'),
    ip:
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip'),
  });

  // Breadcrumb tracking disabled

  if (code) {
    const supabase = await createClient();

    try {
      const startTime = Date.now();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      const duration = Date.now() - startTime;

      // Log the session exchange operation
      logDatabaseQuery(
        'auth.exchangeCodeForSession',
        'auth.sessions',
        duration,
        error || undefined
      );

      if (!error) {
        // Get the user to ensure profile exists
        const userStartTime = Date.now();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const userDuration = Date.now() - userStartTime;

        logDatabaseQuery('auth.getUser', 'auth.users', userDuration);

        if (user) {
          // Log successful authentication
          logAuthEvent('user_authenticated', user.id, true, {
            provider: user.app_metadata?.provider || 'unknown',
            nextUrl: next,
          });

          // User context tracking disabled

          // Check if profile exists
          const profileStartTime = Date.now();
          const { error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .single();
          const profileDuration = Date.now() - profileStartTime;

          logDatabaseQuery(
            'select',
            'profiles',
            profileDuration,
            profileError || undefined,
            { userId: user.id, operation: 'profile_check' }
          );

          if (profileError && profileError.code === 'PGRST116') {
            // Profile doesn't exist, create one
            authLogger.info('Creating user profile', { userId: user.id });

            // Profile creation tracking disabled

            const createProfileStartTime = Date.now();
            const { error: createError } = await supabase
              .from('profiles')
              .insert({
                id: user.id,
                role: 'customer',
                full_name: user.user_metadata?.['full_name'] || null,
              });
            const createProfileDuration = Date.now() - createProfileStartTime;

            logDatabaseQuery(
              'insert',
              'profiles',
              createProfileDuration,
              createError || undefined,
              { userId: user.id, operation: 'profile_creation' }
            );

            if (createError) {
              errorLogger.error('Failed to create user profile', {
                userId: user.id,
                error: createError.message,
                errorCode: createError.code,
              });
            } else {
              logAuthEvent('profile_created', user.id, true);
            }
          }

          authLogger.info('Auth callback successful', {
            userId: user.id,
            redirectTo: next,
          });
        }

        // Redirect to the specified next URL or home
        return NextResponse.redirect(new URL(next, requestUrl.origin));
      } else {
        // Log authentication failure
        logAuthEvent('session_exchange_failed', undefined, false, {
          error: error.message,
          code: error.code,
        });

        errorLogger.error('Auth session exchange failed', {
          error: error.message,
          errorCode: error.code,
          hasCode: !!code,
        });

        // Session exchange error tracking disabled
      }
    } catch (sessionError: any) {
      
      errorLogger.error('Session exchange error', {
        error: sessionError.message,
        hasCode: !!code,
      });
    }
  }

  // Final fallback redirect on success or failure
  return NextResponse.redirect(new URL('/', requestUrl.origin));
}

export async function GET(request: NextRequest) {
  try {
    return await handleAuthCallback(request);
  } catch (error: any) {
    
    return NextResponse.redirect(
      new URL('/?error=callback_error', new URL(request.url).origin)
    );
  }
}

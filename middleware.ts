import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { createAuthMiddleware } from './lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow API routes, static assets, and favicon
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/public/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check if we're in development mode with site lock
  const isDevelopmentLocked =
    process.env.NODE_ENV === 'development' &&
    process.env.SITE_LOCKED === 'true';

  if (isDevelopmentLocked) {
    // Development mode - redirect everything to home page
    if (pathname === '/') {
      return NextResponse.next();
    }

    // Redirect all other routes to home page (development page)
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Production mode or development with site unlocked - use full auth middleware
  return createAuthMiddleware(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public/).*)',
  ],
};

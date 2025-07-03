import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Get user profile if user exists
  let userProfile = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    userProfile = profile
  }

  // Protected customer routes - require authentication
  const customerProtectedRoutes = [
    '/account',
    '/checkout',
    '/orders'
  ]

  // Admin routes - require admin role
  const adminRoutes = [
    '/admin'
  ]

  // Check if current path is a customer protected route
  const isCustomerProtectedRoute = customerProtectedRoutes.some(route => 
    pathname.startsWith(route)
  )

  // Check if current path is an admin route
  const isAdminRoute = adminRoutes.some(route => 
    pathname.startsWith(route)
  )

  // Redirect unauthenticated users from protected routes
  if (isCustomerProtectedRoute && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect unauthenticated users from admin routes
  if (isAdminRoute && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check admin role for admin routes
  if (isAdminRoute && user && userProfile?.role !== 'admin') {
    // Redirect non-admin users to home page
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Redirect authenticated users away from auth pages
  const authRoutes = ['/login', '/register', '/reset-password']
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

  if (isAuthRoute && user) {
    // Check if there's a redirect URL
    const redirectTo = request.nextUrl.searchParams.get('redirectTo')
    if (redirectTo) {
      return NextResponse.redirect(new URL(redirectTo, request.url))
    }
    
    // Default redirect based on user role
    if (userProfile?.role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url))
    } else {
      return NextResponse.redirect(new URL('/account', request.url))
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}

export async function createAuthMiddleware(request: NextRequest) {
  // For development mode, we might want to bypass auth middleware
  // This can be controlled by an environment variable
  const isDevelopmentMode = process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true'
  
  if (isDevelopmentMode) {
    return NextResponse.next()
  }

  return updateSession(request)
}

// Helper function to check if user is admin
export async function isUserAdmin(request: NextRequest): Promise<boolean> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll() {
          // No-op for read-only operations
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return false

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return profile?.role === 'admin'
}

// Helper function to get user profile
export async function getUserProfile(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll() {
          // No-op for read-only operations
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return { user, profile }
} 
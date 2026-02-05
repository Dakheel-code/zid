import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Routes that require admin role
const adminRoutes = ['/admin']

// Routes that require manager role
const managerRoutes = ['/manager']

// Public routes (no authentication required)
const publicRoutes = ['/p', '/book', '/login', '/register', '/']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if it's a public route or home page
  const isPublicRoute = publicRoutes.some(route => 
    route === '/' ? pathname === '/' : pathname.startsWith(route)
  )
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Update session and get user
  const { response, user, supabase } = await updateSession(request)

  // If Supabase is not configured, allow access for development
  if (!supabase) {
    return response
  }

  // If no user and trying to access protected routes, redirect to login
  if (!user) {
    const isProtectedRoute = 
      adminRoutes.some(route => pathname.startsWith(route)) ||
      managerRoutes.some(route => pathname.startsWith(route))
    
    if (isProtectedRoute) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    return response
  }

  // Get user role from database
  const { data: userData } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const userRole = (userData as any)?.role || 'admin'

  // Check admin routes
  if (adminRoutes.some(route => pathname.startsWith(route))) {
    if (userRole !== 'admin') {
      // Redirect non-admins to their appropriate dashboard
      if (userRole === 'manager') {
        return NextResponse.redirect(new URL('/manager', request.url))
      }
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Check manager routes
  if (managerRoutes.some(route => pathname.startsWith(route))) {
    if (userRole !== 'admin' && userRole !== 'manager') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

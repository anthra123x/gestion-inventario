import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(req: NextRequest) {
  const res = NextResponse.next({ request: req })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          for (const [key, value] of Object.entries(headers)) {
            res.headers.set(key, value)
          }
        },
      },
    },
  )

  const { data } = await supabase.auth.getClaims()

  const isAuthenticated = data !== null

  const protectedRoutes = [
    '/dashboard',
    '/inventory',
    '/repairs',
    '/admin',
    '/reports',
  ]
  const isProtectedRoute = protectedRoutes.some((route) => req.nextUrl.pathname.startsWith(route))
  const isAuthRoute = req.nextUrl.pathname.startsWith('/login')

  if (isProtectedRoute && !isAuthenticated) {
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
    const redirectRes = NextResponse.redirect(redirectUrl)
    for (const cookie of req.cookies.getAll()) {
      redirectRes.cookies.set(cookie.name, cookie.value)
    }
    return redirectRes
  }

  if (isAuthRoute && isAuthenticated) {
    const redirectRes = NextResponse.redirect(new URL('/dashboard', req.url))
    for (const cookie of req.cookies.getAll()) {
      redirectRes.cookies.set(cookie.name, cookie.value)
    }
    return redirectRes
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

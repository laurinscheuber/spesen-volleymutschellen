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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
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

  // Refresh session if needed
  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // 1. If not logged in and trying to access guarded routes, redirect to login (/)
  const isGuardedRoute = path.startsWith('/dashboard') || path.startsWith('/admin') || path.startsWith('/profile')
  if (!user) {
    if (isGuardedRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // 2. If logged in, fetch profile to check role and onboarding status
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('full_name, iban, role')
    .eq('id', user.id)
    .single()

  const hasIncompleteProfile = !profile || !profile.full_name || !profile.iban

  // Onboarding redirection: if profile is incomplete, force them to '/profile'
  if (hasIncompleteProfile && path !== '/profile' && !path.startsWith('/auth')) {
    const url = request.nextUrl.clone()
    url.pathname = '/profile'
    return NextResponse.redirect(url)
  }

  // If profile is complete, don't let them go back to '/profile'
  if (!hasIncompleteProfile && path === '/profile') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Role redirection: if trying to access '/admin' but not an admin, redirect to '/dashboard'
  if (path.startsWith('/admin') && (!profile || profile.role !== 'admin')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // If logged in and complete and visiting login page (/), redirect to appropriate dashboard
  if (path === '/') {
    const url = request.nextUrl.clone()
    url.pathname = profile?.role === 'admin' ? '/admin' : '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

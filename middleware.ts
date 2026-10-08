import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // Protect internal routes from unauthenticated users
  if (!user && path !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (user) {
    const rawRole = user.user_metadata?.role || '';
    const role = rawRole.toUpperCase();

    const getDestinationForRole = (r: string) => {
      switch (r) {
        case 'ADMIN': return '/admin';
        case 'CUTTING_SUPERVISOR': return '/cutting-supervisor';
        case 'CUTTING_VERIFIER': return '/verification';
        case 'SEWING_SUPERVISOR': return '/sewing';
        default: return '/login';
      }
    };

    // If logged in and visiting /login, redirect directly to role dashboard
    if (path === '/login') {
      return NextResponse.redirect(new URL(getDestinationForRole(role), request.url));
    }

    // If visiting root /dashboard, redirect based on role
    if (path === '/dashboard') {
      return NextResponse.redirect(new URL(getDestinationForRole(role), request.url));
    }

    // Role-based route scoping:
    // ADMIN can access EVERYTHING (/admin, /cutting-supervisor, /verification, /sewing, etc.)
    // Non-admins can only access their designated departmental area
    if (role !== 'ADMIN') {
      if (path.startsWith('/admin')) {
        return NextResponse.redirect(new URL(getDestinationForRole(role), request.url));
      }
      if (path.startsWith('/cutting-supervisor') && role !== 'CUTTING_SUPERVISOR') {
        return NextResponse.redirect(new URL(getDestinationForRole(role), request.url));
      }
      if (path.startsWith('/verification') && role !== 'CUTTING_VERIFIER') {
        return NextResponse.redirect(new URL(getDestinationForRole(role), request.url));
      }
      if (path.startsWith('/sewing') && role !== 'SEWING_SUPERVISOR') {
        return NextResponse.redirect(new URL(getDestinationForRole(role), request.url));
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
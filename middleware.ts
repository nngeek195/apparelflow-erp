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

  // Protect all internal routes
  if (!user && path !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (user) {
    const role = user.user_metadata?.role;

    // The Supreme Admin can access everything. Everyone else is strictly scoped.
    if (role !== 'ADMIN') {
      if (path.startsWith('/cutting-supervisor') && role !== 'CUTTING_SUPERVISOR') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      
      if (path.startsWith('/verification') && role !== 'CUTTING_VERIFIER') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      
      if (path.startsWith('/sewing') && role !== 'SEWING_SUPERVISOR') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      if (path.startsWith('/admin')) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
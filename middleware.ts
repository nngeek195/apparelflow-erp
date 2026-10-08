import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('apparelflow_jwt')?.value;
  const authHeader = request.headers.get('authorization');
  const hasAuth = Boolean(token || authHeader?.startsWith('Bearer '));

  // 1. Allow public static assets and system files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/next.svg') ||
    pathname.startsWith('/vercel.svg')
  ) {
    return NextResponse.next();
  }

  // 2. Allow public auth endpoints
  if (
    pathname === '/api/auth/register-admin' ||
    pathname === '/api/auth/login' ||
    pathname === '/api/auth/logout'
  ) {
    return NextResponse.next();
  }

  // 3. Handle /login route
  if (pathname === '/login') {
    // If user already holds a valid JWT token, redirect straight to dashboard
    if (token) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // 4. Lock down protected API routes
  if (pathname.startsWith('/api/')) {
    if (!hasAuth) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required. Please provide a valid Firebase JWT token.' },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // 5. Lock down all ERP pages (/, /orders, /verification, /sewing, /recipes, /audit-logs, etc.)
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, images
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

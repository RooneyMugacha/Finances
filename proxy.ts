import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/session';

// ─── Route definitions ────────────────────────────────────────────────────────

const protectedRoutes = ['/dashboard'];
const authRoutes = ['/auth/login', '/auth/signup'];

// ─── Proxy function ───────────────────────────────────────────────────────────

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Check if this is a protected or auth route
  const isProtectedRoute = protectedRoutes.some(
    (route) => path === route || path.startsWith(route + '/'),
  );
  const isAuthRoute = authRoutes.some(
    (route) => path === route || path.startsWith(route + '/'),
  );

  // Read the session cookie directly (no DB hit — optimistic check only)
  const cookie = req.cookies.get('session')?.value;
  const session = await decrypt(cookie);
  const isAuthenticated = !!session?.userId;

  // Redirect unauthenticated users away from protected routes
  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/auth/login', req.nextUrl));
  }

  // Redirect authenticated users away from auth pages to dashboard
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
  }

  return NextResponse.next();
}

// ─── Matcher config ───────────────────────────────────────────────────────────

export const config = {
  matcher: [
    // Run on all routes except Next.js internals, static assets, and API routes
    '/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

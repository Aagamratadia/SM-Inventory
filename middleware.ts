import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only run on targeted routes (configured in matcher below),
  // but keep defensive checks here for clarity.
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // If user is not logged in, block access to protected routes
  if (!token) {
    const loginUrl = new URL('/api/auth/signin', req.url);
    loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  const role = (token as any)?.role as string | undefined;

  // Admin-only area
  if (pathname.startsWith('/admin')) {
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  // For requests pages, any authenticated user is allowed.
  // No extra checks needed; reaching here means token exists.

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/requests',
    '/dashboard/requests/:path*',
  ],
};

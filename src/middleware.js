import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret'
);

export async function middleware(request) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Paths requiring authentication
  const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/admin');

  if (isProtectedRoute) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      // Verify token
      const { payload } = await jwtVerify(token, SECRET);

      // Admin path access control
      if (pathname.startsWith('/admin') && payload.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      
      return NextResponse.next();
    } catch (error) {
      console.error('Middleware token validation failed:', error);
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('token');
      return response;
    }
  }

  // Redirect to dashboard if logged in and visiting login/register
  if ((pathname === '/login' || pathname === '/register') && token) {
    try {
      await jwtVerify(token, SECRET);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } catch (e) {
      // Invalid token, allow login/register
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/login', '/register'],
};

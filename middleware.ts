import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from '@/utils/jwt';

// Helper to determine role route access
function getRequiredRoleForPath(path: string): string | null {
  if (path.startsWith('/patient')) return 'PATIENT';
  if (path.startsWith('/doctor')) return 'DOCTOR';
  if (path.startsWith('/receptionist')) return 'RECEPTIONIST';
  if (path.startsWith('/admin')) return 'ADMIN';
  if (path.startsWith('/super-admin')) return 'SUPER_ADMIN';
  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Exclude API routes, assets, and auth pages from verification
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/login') ||
    pathname === '/' ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const tokenCookie = request.cookies.get('token');
  const token = tokenCookie?.value;

  // Check if route requires role authorization
  const requiredRole = getRequiredRoleForPath(pathname);
  if (!requiredRole) {
    return NextResponse.next();
  }

  // If no token exists, redirect to login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    // Preserving the original request path for post-login redirect
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify the JWT token
  const payload = await verifyJWT(token);
  if (!payload || !payload.role) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('token');
    return response;
  }

  // Role verification check
  const userRole = payload.role as string;

  // Let Admins and Super Admins bypass generic lower role restrictions (e.g. receptionist or doctor screens) if needed,
  // but strictly block Patients from entering any personnel or administration sections.
  if (userRole === 'PATIENT' && requiredRole !== 'PATIENT') {
    return NextResponse.redirect(new URL('/patient', request.url));
  }
  
  if (userRole === 'DOCTOR' && requiredRole !== 'DOCTOR') {
    return NextResponse.redirect(new URL('/doctor', request.url));
  }

  if (userRole === 'RECEPTIONIST' && requiredRole !== 'RECEPTIONIST') {
    return NextResponse.redirect(new URL('/receptionist', request.url));
  }

  if (userRole === 'ADMIN' && requiredRole !== 'ADMIN' && requiredRole !== 'RECEPTIONIST' && requiredRole !== 'DOCTOR') {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  if (userRole === 'SUPER_ADMIN' && requiredRole === 'PATIENT') {
    return NextResponse.redirect(new URL('/super-admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/patient/:path*',
    '/doctor/:path*',
    '/receptionist/:path*',
    '/admin/:path*',
    '/super-admin/:path*',
  ],
};

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { signToken, verifyToken } from '@/lib/auth/session';

const protectedRoutes = '/dashboard';
const protectedRoutes2 = '/generating';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session');
  const isProtectedRoute = pathname.startsWith(protectedRoutes) || pathname.startsWith(protectedRoutes2);

  if (isProtectedRoute && !sessionCookie) {
    console.log('User is not authenticated - redirecting to sign-in with dashboard');
    return NextResponse.redirect(new URL('/sign-in?redirect=dashboard', request.url));
  }

  let res = NextResponse.next();

  if (sessionCookie && request.method === 'GET') {
    try {
      const parsed = await verifyToken(sessionCookie.value);
      const expiresInFourteenDays = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days

      res.cookies.set({
        name: 'session',
        value: await signToken({
          ...parsed,
          expires: expiresInFourteenDays.toISOString()
        }),
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        expires: expiresInFourteenDays
      });
    } catch (error) {
      console.error('Error updating session:', error);
      res.cookies.delete('session');
      if (isProtectedRoute) {
        return NextResponse.redirect(new URL('/sign-in?redirect=dashboard', request.url));
      }
    }
  }

  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
  runtime: 'nodejs'
};

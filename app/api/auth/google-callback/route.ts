import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { getUserByEmail } from '@/lib/db/queries';
import { setSession } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const searchParams = request.nextUrl.searchParams;
    const redirect = searchParams.get('redirect');
    const priceId = searchParams.get('priceId');
    
    if (session?.user?.email) {
      // Get user from database and set our custom session
      const user = await getUserByEmail(session.user.email);
      if (user) {
        await setSession(user);
      }
    }
    
    // Determine redirect URL (same logic as OTP)
    let redirectUrl = '/dashboard';
    if (redirect === 'checkout') {
      redirectUrl = priceId ? `/pricing?priceId=${priceId}` : '/pricing';
    } else if (redirect) {
      redirectUrl = redirect;
    }
    
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  } catch (error) {
    console.error('Error in Google callback:', error);
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }
}
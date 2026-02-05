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
    const plan = searchParams.get('plan');
    const websiteUrl = searchParams.get('website_url');
    
    if (session?.user?.email) {
      // Get user from database and set our custom session
      const user = await getUserByEmail(session.user.email);
      if (user) {
        await setSession(user);
      }
    }
    
    // Determine redirect URL (same logic as OTP)
    let redirectUrl = '/dashboard'; // Default to dashboard
    if (redirect === 'input-url') {
      redirectUrl = '/input-url';
    } else if (redirect === 'checkout') {
      // Redirect to your-credits page after login for checkout
      if (plan) {
        const params = new URLSearchParams();
        params.set('plan', plan);
        const interval = searchParams.get('interval');
        if (interval) {
          params.set('interval', interval);
        }
        redirectUrl = `/dashboard/your-credits?${params.toString()}`;
      } else {
        redirectUrl = '/dashboard/your-credits';
      }
    } else if (redirect === 'generate' && websiteUrl) {
      // Redirect to root with params - oauth-redirect-handler will start generation
      redirectUrl = `/generating?website_url=${encodeURIComponent(websiteUrl)}&login=true`;
    } else if (redirect) {
      redirectUrl = redirect;
    }
    
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  } catch (error) {
    console.error('Error in Google callback:', error);
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }
}
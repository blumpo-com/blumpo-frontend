import { NextRequest, NextResponse } from 'next/server';
import { removeNewsletterSubscriber } from '@/lib/db/queries/newsletter';
import { unsubscribeNewsletterInBrevo } from '@/lib/brevo';
import { verifyUnsubscribeToken } from '@/lib/auth/newsletter-token';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const emailFromBody = typeof body.email === 'string' ? body.email.trim() : null;
    const token = typeof body.token === 'string' ? body.token : request.nextUrl.searchParams.get('token');

    let email: string | null = null;

    if (token) {
      email = await verifyUnsubscribeToken(token);
    }
    if (!email && emailFromBody) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(emailFromBody)) {
        email = emailFromBody.toLowerCase();
      }
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Valid email or token is required' },
        { status: 400 }
      );
    }

    await removeNewsletterSubscriber(email);
    await unsubscribeNewsletterInBrevo(email);

    return NextResponse.json({ status: 'unsubscribed' });
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

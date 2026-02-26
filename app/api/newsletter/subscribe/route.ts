import { NextRequest, NextResponse } from 'next/server';
import { isEmailSubscribed, addNewsletterSubscriber } from '@/lib/db/queries/newsletter';
import { getUserByEmail } from '@/lib/db/queries/user';
import { resend } from '@/lib/auth/otp';
import { signNewsletterToken } from '@/lib/auth/newsletter-token';
import { renderNewsletterConfirmationEmailTemplate } from '@/lib/auth/templates/newsletterConfirmationEmailTemplate';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const alreadySubscribed = await isEmailSubscribed(email);
    if (alreadySubscribed) {
      return NextResponse.json({ status: 'already-subscribed' });
    }

    const existingUser = await getUserByEmail(email);

    if (existingUser) {
      // Known user — email already verified via their account, subscribe directly
      await addNewsletterSubscriber(email, existingUser.id);
      return NextResponse.json({ status: 'subscribed' });
    }

    // Unknown email — generate a signed confirmation token and send an email.
    // Do NOT write to DB until the user confirms via the link.
    const token = await signNewsletterToken(email);
    const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';
    const confirmationUrl = `${baseUrl}/newsletter/confirm?token=${encodeURIComponent(token)}`;

    const { error } = await resend.emails.send({
      from: 'Blumpo <no-reply@blumpo.com>',
      to: email,
      subject: 'Confirm your Blumpo newsletter subscription',
      html: renderNewsletterConfirmationEmailTemplate(confirmationUrl),
    });

    if (error) {
      console.error('Failed to send newsletter confirmation email:', error);
      return NextResponse.json({ error: 'Failed to send confirmation email' }, { status: 500 });
    }

    return NextResponse.json({ status: 'email-sent' });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

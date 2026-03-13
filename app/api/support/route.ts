import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendBrevoEmail } from '@/lib/brevo';
import { SupportCategory, isSalesCategory } from '@/lib/constants/support-categories';
import { renderSupportRequestEmail, renderSupportConfirmationEmail } from '@/lib/email-templates/support-templates';

const supportSchema = z.object({
  title: z.nativeEnum(SupportCategory, {
    errorMap: () => ({ message: 'Please select a valid category' }),
  }),
  message: z.string().min(1, 'Message is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  honeypot: z.string().max(0, 'Invalid submission').optional().or(z.literal('')),
});

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const rateLimitMap = new Map<string, RateLimitEntry>();

const RATE_LIMIT_WINDOW = 60 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  return 'unknown';
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  entry.count++;
  return true;
}

function getSupportEmail(title: string): string {
  const domain = process.env.SUPPORT_EMAIL_DOMAIN || 'blumpo.com';
  
  // Sales-related categories go to sales@blumpo.com
  if (isSalesCategory(title)) {
    return `sales@${domain}`;
  }
  
  // All other categories go to support@blumpo.com
  return `support@${domain}`;
}


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const ipAddress = getClientIp(request);

    if (!checkRateLimit(ipAddress)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const validationResult = supportSchema.safeParse(body);

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      
      if (firstError.path.includes('honeypot')) {
        return NextResponse.json(
          { error: 'Invalid submission' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: firstError.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { title, message, email, honeypot } = validationResult.data;

    if (honeypot && honeypot.length > 0) {
      return NextResponse.json(
        { error: 'Invalid submission' },
        { status: 400 }
      );
    }

    const supportEmail = getSupportEmail(title);
    const domain = process.env.SUPPORT_EMAIL_DOMAIN || 'blumpo.com';
    const sender = { name: 'Support', email: `support@${domain}` };

    const supportEmailBody = renderSupportRequestEmail(
      title,
      message,
      email || undefined,
      ipAddress
    );

    const supportResult = await sendBrevoEmail({
      sender,
      to: [{ email: supportEmail }],
      subject: `[Support] ${title}`,
      htmlContent: supportEmailBody,
      ...(email && { replyTo: { email } }),
    });

    if (!supportResult.success) {
      console.error('Failed to send support email:', supportResult.error);
      return NextResponse.json(
        { error: 'Failed to send message. Please try again later.' },
        { status: 500 }
      );
    }

    if (email) {
      const confirmationEmailBody = renderSupportConfirmationEmail(title, message);
      const confirmationResult = await sendBrevoEmail({
        sender,
        to: [{ email }],
        subject: `Re: [Support] ${title}`,
        htmlContent: confirmationEmailBody,
        replyTo: { email: supportEmail },
      });
      if (!confirmationResult.success) {
        console.error('Failed to send confirmation email:', confirmationResult.error);
      }
    }

    return NextResponse.json(
      { success: true, message: 'Support message sent successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Support form error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}


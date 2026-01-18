import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const supportSchema = z.object({
  title: z.string().min(1, 'Title is required'),
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

function getSupportEmail(): string {
  const domain = process.env.SUPPORT_EMAIL_DOMAIN || 'blumpo.com';
  return `support@${domain}`;
}

function formatEmailBody(
  title: string,
  message: string,
  userEmail?: string,
  ipAddress?: string
): string {
  const timestamp = new Date().toISOString();
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #0a0a0a; border-bottom: 2px solid #00bfa6; padding-bottom: 10px;">
        New Support Request
      </h2>
      
      <div style="margin-top: 20px;">
        <h3 style="color: #0a0a0a; margin-bottom: 10px;">Subject:</h3>
        <p style="background: #f9fafb; padding: 12px; border-radius: 6px; color: #0a0a0a;">
          ${escapeHtml(title)}
        </p>
      </div>
      
      <div style="margin-top: 20px;">
        <h3 style="color: #0a0a0a; margin-bottom: 10px;">Message:</h3>
        <p style="background: #f9fafb; padding: 12px; border-radius: 6px; color: #0a0a0a; white-space: pre-wrap;">
          ${escapeHtml(message)}
        </p>
      </div>
      
      ${userEmail ? `
        <div style="margin-top: 20px;">
          <h3 style="color: #0a0a0a; margin-bottom: 10px;">User Email:</h3>
          <p style="background: #f9fafb; padding: 12px; border-radius: 6px; color: #0a0a0a;">
            <a href="mailto:${escapeHtml(userEmail)}" style="color: #00bfa6; text-decoration: none;">
              ${escapeHtml(userEmail)}
            </a>
          </p>
        </div>
      ` : ''}
      
      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #888e98; font-size: 12px; margin: 5px 0;">
          <strong>Timestamp:</strong> ${timestamp}
        </p>
        ${ipAddress && ipAddress !== 'unknown' ? `
          <p style="color: #888e98; font-size: 12px; margin: 5px 0;">
            <strong>IP Address:</strong> ${escapeHtml(ipAddress)}
          </p>
        ` : ''}
      </div>
    </div>
  `;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
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

    const supportEmail = getSupportEmail();
    const domain = process.env.SUPPORT_EMAIL_DOMAIN || 'blumpo.com';
    const fromEmail = `Support <support@${domain}>`;

    const emailBody = formatEmailBody(title, message, email || undefined, ipAddress);

    const emailData: any = {
      from: fromEmail,
      to: supportEmail,
      subject: `[Support] ${title}`,
      html: emailBody,
    };

    if (email) {
      emailData.replyTo = email;
    }

    const result = await resend.emails.send(emailData);

    if (result.error) {
      console.error('Failed to send support email:', result.error);
      return NextResponse.json(
        { error: 'Failed to send message. Please try again later.' },
        { status: 500 }
      );
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


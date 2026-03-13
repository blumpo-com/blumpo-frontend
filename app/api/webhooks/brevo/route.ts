import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  recordBrevoDeliveryFailure,
  isBrevoFailureEvent,
} from '@/lib/brevo-delivery-failures';

/** Brevo transactional webhook payload (common fields). */
type BrevoWebhookPayload = {
  event: string;
  email?: string;
  id?: number;
  date?: string;
  ts?: number;
  'message-id'?: string;
  ts_event?: number;
  subject?: string;
  ts_epoch?: number;
  tags?: string[];
  reason?: string;
};

function verifyBrevoSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.BREVO_WEBHOOK_SECRET?.trim();
  if (!secret || !signature) return false;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');
  const received = signature.replace(/^sha256=/, '');
  if (expected.length !== received.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(received, 'hex'));
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const signature = request.headers.get('x-brevo-signature');
  if (process.env.BREVO_WEBHOOK_SECRET?.trim() && !verifyBrevoSignature(rawBody, signature)) {
    console.error('[Brevo webhook] Signature verification failed');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let payload: BrevoWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as BrevoWebhookPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const event = payload.event;
  const email = payload.email?.trim();
  if (!email) {
    return NextResponse.json({ received: true });
  }

  if (isBrevoFailureEvent(event)) {
    await recordBrevoDeliveryFailure(email, {
      event,
      reason: payload.reason,
      subject: payload.subject,
      ts_epoch: payload.ts_epoch,
      date: payload.date,
    });
    console.log('[Brevo webhook] Recorded delivery failure:', event, email);
  }

  return NextResponse.json({ received: true });
}

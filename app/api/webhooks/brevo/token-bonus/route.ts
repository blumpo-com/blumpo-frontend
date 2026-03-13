import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getUserByEmail } from '@/lib/db/queries/user';
import {
  createOrUpdateTokenAccount,
  appendTokenLedgerEntry,
} from '@/lib/db/queries/tokens';

/** Number of tokens to add when the Brevo token-bonus webhook is received. */
const BREVO_BONUS_TOKENS = 100;

/**
 * Brevo workflow webhook payload (as seen from `workflow-action-processor`).
 *
 * Example:
 * {
 *   "appName": "workflow-action-processor",
 *   "attributes": { "FIRSTNAME": "Franciszek", "LASTNAME": "Zarębski" },
 *   "contact_id": 15,
 *   "email": "fran.zarebski@gmail.com",
 *   "params": { "lists": [{ "id": 11, "name": "test" }], "origin": "plat" },
 *   "step_id": 1,
 *   "workflow_id": 12
 * }
 */
type BrevoWorkflowPayload = {
  appName?: string;
  email?: string;
  contact_id?: number;
  workflow_id?: number;
  step_id?: number;
  params?: {
    origin?: string;
    lists?: { id: number; name: string }[];
    [key: string]: unknown;
  };
  attributes?: Record<string, unknown>;
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
    console.error('[Brevo token-bonus] Signature verification failed');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let payload: BrevoWorkflowPayload;
  try {
    payload = JSON.parse(rawBody) as BrevoWorkflowPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const email = payload.email?.trim();
  if (!email) {
    console.warn('[Brevo token-bonus] Missing email in payload');
    return NextResponse.json({ received: true });
  }

  const user = await getUserByEmail(email);
  if (!user) {
    console.warn('[Brevo token-bonus] No user found for email', email);
    return NextResponse.json({ received: true });
  }

  const refId = `brevo-token-bonus-${payload.workflow_id ?? 'wf'}-${payload.step_id ?? 'step'}-${
    payload.contact_id ?? email.toLowerCase()
  }`;

  try {
    await appendTokenLedgerEntry(user.id, BREVO_BONUS_TOKENS, 'BREVO_BONUS', refId);
    console.log('[Brevo token-bonus] Added', BREVO_BONUS_TOKENS, 'tokens for', email);
  } catch (err) {
    console.error('[Brevo token-bonus] Failed for', email, err);
  }

  return NextResponse.json({ received: true });
}

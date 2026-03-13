/**
 * Store and retrieve Brevo transactional email delivery failures (bounce, invalid, blocked, error).
 * Used to surface "we couldn't deliver the previous email" to users (e.g. OTP flow).
 * Uses Redis only, same client pattern as lib/api/callback-waiter.ts (singleton, UPSTASH_* / KV_* env).
 */

let Redis: any = null;
try {
  const redisModule = require('@upstash/redis');
  Redis = redisModule.Redis;
} catch {
  // @upstash/redis not available
}

const REDIS_KEY_PREFIX = 'brevo:delivery_failure:';
const TTL_DAYS = 7;

let redisClient: any = null;

function getRedisClient(): any {
  if (!Redis) return null;
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  if (!redisClient) {
    redisClient = new Redis({ url, token });
  }
  return redisClient;
}

export type BrevoDeliveryFailurePayload = {
  event: string;
  reason?: string;
  subject?: string;
  ts_epoch?: number;
  date?: string;
};

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

function redisKey(email: string): string {
  return `${REDIS_KEY_PREFIX}${normalizeEmail(email)}`;
}

/** Events we treat as "delivery failed" for surfacing to the user. */
export const BREVO_FAILURE_EVENTS = [
  'hard_bounce',
  'soft_bounce',
  'invalid_email',
  'blocked',
  'error',
] as const;

export function isBrevoFailureEvent(event: string): boolean {
  return (BREVO_FAILURE_EVENTS as readonly string[]).includes(event);
}

/**
 * Record a delivery failure for an email (called from webhook handler).
 * No-op if Redis is not configured.
 */
export async function recordBrevoDeliveryFailure(
  email: string,
  payload: BrevoDeliveryFailurePayload
): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  const normalized = normalizeEmail(email);
  const value = {
    event: payload.event,
    reason: payload.reason,
    subject: payload.subject,
    ts_epoch: payload.ts_epoch,
    date: payload.date,
  };
  const ttlSeconds = TTL_DAYS * 24 * 60 * 60;
  try {
    await redis.set(redisKey(normalized), JSON.stringify(value), { ex: ttlSeconds });
  } catch (err) {
    console.error('[Brevo delivery failures] Redis set error:', err);
  }
}

/**
 * Get the last recorded delivery failure for an email, if any.
 * Returns null if Redis is not configured or no failure is stored.
 */
export async function getBrevoDeliveryFailure(
  email: string
): Promise<BrevoDeliveryFailurePayload | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  const normalized = normalizeEmail(email);
  try {
    const raw = await redis.get(redisKey(normalized));
    if (raw == null) return null;
    if (typeof raw === 'object' && typeof (raw as Record<string, unknown>).event === 'string') {
      return raw as BrevoDeliveryFailurePayload;
    }
    if (typeof raw === 'string') {
      return JSON.parse(raw) as BrevoDeliveryFailurePayload;
    }
    return null;
  } catch (err) {
    console.error('[Brevo delivery failures] Redis get error:', err);
    return null;
  }
}

/**
 * Clear a stored delivery failure (e.g. after showing the warning to the user).
 */
export async function clearBrevoDeliveryFailure(email: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  const normalized = normalizeEmail(email);
  try {
    await redis.del(redisKey(normalized));
  } catch (err) {
    console.error('[Brevo delivery failures] Redis del error:', err);
  }
}

/**
 * Human-readable message for a failure event (for displaying to the user).
 */
export function deliveryFailureMessage(payload: BrevoDeliveryFailurePayload): string {
  const reason = payload.reason?.trim();
  switch (payload.event) {
    case 'invalid_email':
      return "We couldn't deliver the previous login code: this email address appears invalid. Please check it and try again.";
    case 'hard_bounce':
      return reason
        ? `We couldn't deliver the previous login code (${reason}). A new code has been sent.`
        : "We couldn't deliver the previous login code to this address. A new code has been sent. If you don't receive it, check your email address.";
    case 'soft_bounce':
      return reason
        ? `The previous login code was delayed or not delivered (${reason}). A new code has been sent.`
        : "The previous login code couldn't be delivered. A new code has been sent.";
    case 'blocked':
      return "We couldn't deliver the previous login code (blocked). A new code has been sent. Check your spam folder or email provider.";
    case 'error':
      return "We had a problem delivering the previous login code. A new code has been sent.";
    default:
      return "We couldn't deliver the previous login code to this address. A new code has been sent. If you don't receive it, check your email address.";
  }
}

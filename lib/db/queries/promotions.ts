import { and, eq } from 'drizzle-orm';
import { db } from '../drizzle';
import { tokenAccountPromotion } from '../schema/index';

const WELCOME_50_10M_KEY = 'welcome_50_10m';
const TEN_MINUTES_MS = 10 * 60 * 1000;

export interface WelcomePromotionResult {
  eligible: boolean;
  status?: string;
  startedAt?: string | null;
  expiresAt?: string | null;
}

/**
 * Get or create the welcome_50_10m promotion for the given token account.
 * - If no row exists and user is eligible (FREE plan only): create row, start 10m timer.
 * - If row exists and active and not expired: return as-is (do not reset timer).
 * - If row exists and expired: update status to expired and return.
 */
export async function getOrCreateWelcomePromotion(
  tokenAccountId: string,
  planCode: string,
  stripePromotionCodeId: string | null
): Promise<WelcomePromotionResult> {
  const existing = await db
    .select()
    .from(tokenAccountPromotion)
    .where(
      and(
        eq(tokenAccountPromotion.tokenAccountId, tokenAccountId),
        eq(tokenAccountPromotion.promotionKey, WELCOME_50_10M_KEY)
      )
    )
    .limit(1);

  const now = new Date();

  if (existing.length > 0) {
    const row = existing[0];
    if (row.status === 'active' && row.expiresAt && now < new Date(row.expiresAt)) {
      return {
        eligible: true,
        status: row.status,
        startedAt: row.startedAt?.toISOString() ?? null,
        expiresAt: row.expiresAt?.toISOString() ?? null,
      };
    }
    if (row.expiresAt && now >= new Date(row.expiresAt) && row.status === 'active') {
      await db
        .update(tokenAccountPromotion)
        .set({ status: 'expired', updatedAt: now })
        .where(eq(tokenAccountPromotion.id, row.id));
      return { eligible: false, status: 'expired' };
    }
    return { eligible: false, status: row.status };
  }

  // No row: check eligibility (FREE plan only)
  if (planCode !== 'FREE') {
    return { eligible: false };
  }

  const expiresAt = new Date(now.getTime() + TEN_MINUTES_MS);
  await db.insert(tokenAccountPromotion).values({
    tokenAccountId,
    promotionKey: WELCOME_50_10M_KEY,
    stripePromotionCodeId: stripePromotionCodeId ?? null,
    stripeCouponId: null,
    status: 'active',
    startedAt: now,
    expiresAt,
    updatedAt: now,
  });

  return {
    eligible: true,
    status: 'active',
    startedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
}

/**
 * Get active welcome promotion for checkout. Returns the row only if status is active and now < expires_at.
 */
export async function getActiveWelcomePromotionForCheckout(
  tokenAccountId: string
): Promise<{ id: number; stripePromotionCodeId: string | null } | null> {
  const now = new Date();
  const rows = await db
    .select({
      id: tokenAccountPromotion.id,
      stripePromotionCodeId: tokenAccountPromotion.stripePromotionCodeId,
      status: tokenAccountPromotion.status,
      expiresAt: tokenAccountPromotion.expiresAt,
    })
    .from(tokenAccountPromotion)
    .where(
      and(
        eq(tokenAccountPromotion.tokenAccountId, tokenAccountId),
        eq(tokenAccountPromotion.promotionKey, WELCOME_50_10M_KEY)
      )
    )
    .limit(1);

  const row = rows[0];
  if (
    !row ||
    row.status !== 'active' ||
    !row.expiresAt ||
    now >= new Date(row.expiresAt)
  ) {
    return null;
  }
  return { id: row.id, stripePromotionCodeId: row.stripePromotionCodeId };
}

/** Mark promotion as used after successful checkout. */
export async function markPromotionUsed(promotionId: number): Promise<void> {
  const now = new Date();
  await db
    .update(tokenAccountPromotion)
    .set({ status: 'used', consumedAt: now, updatedAt: now })
    .where(eq(tokenAccountPromotion.id, promotionId));
}

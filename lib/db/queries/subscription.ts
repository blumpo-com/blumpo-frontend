import { eq, sql, desc } from 'drizzle-orm';
import { db } from '../drizzle';
import { user, tokenAccount, tokenLedger, subscriptionPlan, topupPlan } from '../schema/index';
import { Timestamp } from 'next/dist/server/lib/cache-handlers/types';

// Get all active subscription plans
export async function getSubscriptionPlans() {
  return await db
    .select()
    .from(subscriptionPlan)
    .where(eq(subscriptionPlan.isActive, true))
    .orderBy(subscriptionPlan.sortOrder);
}

// Get all active topup plans
export async function getTopupPlans() {
  return await db
    .select()
    .from(topupPlan)
    .where(eq(topupPlan.isActive, true))
    .orderBy(topupPlan.sortOrder);
}

// Get subscription plan by code
export async function getSubscriptionPlan(planCode: string) {
  const result = await db
    .select()
    .from(subscriptionPlan)
    .where(eq(subscriptionPlan.planCode, planCode))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

// Get subscription plan by Stripe price ID (legacy - kept for compatibility)
export async function getSubscriptionPlanByStripePriceId(stripePriceId: string) {
  // This function is now deprecated since we removed stripePriceId from the schema
  // For now, return null to handle gracefully
  return null;
}

// Get subscription plan by Stripe product ID
export async function getSubscriptionPlanByStripeProductId(productId: string) {
  const result = await db
    .select()
    .from(subscriptionPlan)
    .where(eq(subscriptionPlan.stripeProductId, productId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

// Get topup plan by SKU
export async function getTopupPlan(topupSku: string) {
  const result = await db
    .select()
    .from(topupPlan)
    .where(eq(topupPlan.topupSku, topupSku))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

// Stripe-related user/token_account queries
export async function getTokenAccountByStripeCustomerId(stripeCustomerId: string) {
  const result = await db
    .select({
      tokenAccount: tokenAccount,
      user: user,
    })
    .from(tokenAccount)
    .innerJoin(user, eq(tokenAccount.userId, user.id))
    .where(eq(tokenAccount.stripeCustomerId, stripeCustomerId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function getUserWithTokenAccount(userId: string) {
  const result = await db
    .select({
      user: user,
      tokenAccount: tokenAccount,
    })
    .from(user)
    .leftJoin(tokenAccount, eq(user.id, tokenAccount.userId))
    .where(eq(user.id, userId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

// Reserve tokens for a generation job
export async function reserveTokens(userId: string, tokensCost: number, jobId: string) {
  return await db.transaction(async (tx) => {
    // Lock the token account for update
    const account = await tx
      .select()
      .from(tokenAccount)
      .where(eq(tokenAccount.userId, userId))
      .for('update')
      .limit(1);

    if (account.length === 0) {
      throw new Error('Token account not found');
    }

    const currentBalance = account[0].balance;
    if (currentBalance < tokensCost) {
      throw new Error('INSUFFICIENT_TOKENS');
    }

    const newBalance = currentBalance - tokensCost;

    // Create ledger entry
    await tx.insert(tokenLedger).values({
      userId,
      delta: -tokensCost,
      reason: 'JOB_RESERVE',
      referenceId: jobId,
      balanceAfter: newBalance,
    });

    // Update balance
    await tx
      .update(tokenAccount)
      .set({ balance: newBalance })
      .where(eq(tokenAccount.userId, userId));

    return newBalance;
  });
}

// Refund tokens for a failed generation job
export async function refundTokens(userId: string, tokensCost: number, jobId: string) {
  return await db.transaction(async (tx) => {
    // Check if refund already exists (idempotency)
    const existingRefund = await tx
      .select()
      .from(tokenLedger)
      .where(sql`${tokenLedger.reason} = 'JOB_REFUND' AND ${tokenLedger.referenceId} = ${jobId}`)
      .limit(1);

    if (existingRefund.length > 0) {
      return; // Already refunded
    }

    // Lock the token account for update
    const account = await tx
      .select()
      .from(tokenAccount)
      .where(eq(tokenAccount.userId, userId))
      .for('update')
      .limit(1);

    if (account.length === 0) {
      throw new Error('Token account not found');
    }

    const currentBalance = account[0].balance;
    const newBalance = currentBalance + tokensCost;

    // Create ledger entry
    await tx.insert(tokenLedger).values({
      userId,
      delta: tokensCost,
      reason: 'JOB_REFUND',
      referenceId: jobId,
      balanceAfter: newBalance,
    });

    // Update balance
    await tx
      .update(tokenAccount)
      .set({ balance: newBalance })
      .where(eq(tokenAccount.userId, userId));

    return newBalance;
  });
}

// Add tokens from topup purchase
export async function addTopupTokens(userId: string, tokensAmount: number, checkoutSessionId: string, topupSku: string) {
  return await db.transaction(async (tx) => {

    // Check if topup already processed (idempotency)
    const existingTopup = await tx
      .select()
      .from(tokenLedger)
      .where(sql`${tokenLedger.reason} = 'TOPUP_PURCHASE:${topupSku}' AND ${tokenLedger.referenceId} = ${checkoutSessionId}`)
      .limit(1);
    if (existingTopup.length > 0) {
      return; // Already processed
    }

    // Lock the token account for update
    const account = await tx
      .select()
      .from(tokenAccount)
      .where(eq(tokenAccount.userId, userId))
      .for('update')
      .limit(1);

    if (account.length === 0) {
      throw new Error('Token account not found');
    }

    const currentBalance = account[0].balance;
    const newBalance = currentBalance + tokensAmount;

    // Create ledger entry
    await tx.insert(tokenLedger).values({
      userId,
      delta: tokensAmount,
      reason: `TOPUP_PURCHASE:${topupSku}`,
      referenceId: checkoutSessionId,
      balanceAfter: newBalance,
    });

    // Update balance
    await tx
      .update(tokenAccount)
      .set({ balance: newBalance })
      .where(eq(tokenAccount.userId, userId));

    return newBalance;
  });
}

// Refill tokens for subscription renewal
export async function refillSubscriptionTokens(userId: string, tokensPerPeriod: number, refillDate: string) {
  return await db.transaction(async (tx) => {
    // Check if refill already processed (idempotency)
    const existingRefill = await tx
      .select()
      .from(tokenLedger)
      .where(sql`${tokenLedger.reason} = 'SUBS_REFILL' AND ${tokenLedger.referenceId} = ${refillDate}`)
      .limit(1);

    if (existingRefill.length > 0) {
      return; // Already processed
    }

    // Lock the token account for update
    const account = await tx
      .select()
      .from(tokenAccount)
      .where(eq(tokenAccount.userId, userId))
      .for('update')
      .limit(1);

    if (account.length === 0) {
      throw new Error('Token account not found');
    }

    const currentBalance = account[0].balance;
    let newBalance: number;
    let delta: number;

    // If user has fewer tokens than plan amount, add tokens to reach plan amount
    // If user has more tokens, subtract them to match plan amount

    delta = tokensPerPeriod - currentBalance;
    newBalance = tokensPerPeriod;
    // Only create ledger entry if tokens were actually added
    if (delta > 0) {
      await tx.insert(tokenLedger).values({
        userId,
        delta: delta,
        reason: 'SUBS_REFILL',
        referenceId: refillDate,
        balanceAfter: newBalance,
      });
    }

    // Update refill dates regardless of whether tokens were added
    const now = new Date();
    const nextRefill = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

    await tx
      .update(tokenAccount)
      .set({
        balance: newBalance,
        lastRefillAt: now,
        nextRefillAt: nextRefill,
      })
      .where(eq(tokenAccount.userId, userId));

    return newBalance;
  });
}

export async function updateUserSubscription(
  userId: string,
  subscriptionData: {
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    stripeProductId?: string | null;
    stripePriceId?: string | null;
    subscriptionStatus?: string | null;
    planCode?: string;
    lastRefillAt?: Date | null;
    nextRefillAt?: Date | null;
    cancellationTime?: Date | null;
  }
) {
  // First ensure token account exists
  const existingAccount = await db
    .select()
    .from(tokenAccount)
    .where(eq(tokenAccount.userId, userId))
    .limit(1);

  if (existingAccount.length === 0) {
    // Create token account if it doesn't exist
    await db.insert(tokenAccount).values({
      userId,
      ...subscriptionData,
    });
  } else {
    // Update existing token account
    await db
      .update(tokenAccount)
      .set(subscriptionData)
      .where(eq(tokenAccount.userId, userId));
  }
}

// Activate subscription and ensure proper token allocation
export async function activateSubscription(
  userId: string,
  subscriptionData: {
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    stripeProductId?: string | null;
    stripePriceId?: string | null;
    subscriptionStatus?: string | null;
    planCode: string;
    cancellationTime?: Date | null;
  },
  planTokens: number
) {
  return await db.transaction(async (tx) => {
    // Update subscription data
    await updateUserSubscription(userId, subscriptionData);

    // Lock the token account for update
    const account = await tx
      .select()
      .from(tokenAccount)
      .where(eq(tokenAccount.userId, userId))
      .for('update')
      .limit(1);

    if (account.length === 0) {
      throw new Error('Token account not found after subscription update');
    }

    const currentBalance = account[0].balance;
    let newBalance: number;
    let delta: number;

    // Ensure user has at least the subscription plan tokens
    // Dont update when user changed for free plan
    if (currentBalance < planTokens && subscriptionData.planCode !== 'FREE') {
      delta = planTokens - currentBalance;
      newBalance = planTokens;

      // Create ledger entry for subscription activation
      await tx.insert(tokenLedger).values({
        userId,
        delta: delta,
        reason: 'SUBS_ACTIVATION',
        referenceId: subscriptionData.stripeSubscriptionId || undefined,
        balanceAfter: newBalance,
      });
    } else {
      // User already has enough tokens, keep current balance
      newBalance = currentBalance;
    }

    // Update token account with new balance and refill dates
    const now = new Date();
    const nextRefill = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate(), now.getHours(), now.getMinutes() + 5, now.getSeconds());

    await tx
      .update(tokenAccount)
      .set({
        balance: newBalance,
        lastRefillAt: now,
        nextRefillAt: nextRefill,
      })
      .where(eq(tokenAccount.userId, userId));

    return newBalance;
  });
}

// Get token ledger history for a user
export async function getTokenLedgerHistory(userId: string, limit: number = 50) {
  return await db
    .select()
    .from(tokenLedger)
    .where(eq(tokenLedger.userId, userId))
    .orderBy(desc(tokenLedger.occurredAt))
    .limit(limit);
}
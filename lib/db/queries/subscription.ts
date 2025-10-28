import { eq } from 'drizzle-orm';
import { db } from '../drizzle';
import { user, tokenAccount } from '../schema/index';

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

export async function updateUserSubscription(
  userId: string,
  subscriptionData: {
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    stripeProductId?: string | null;
    stripePriceId?: string | null;
    subscriptionStatus?: string | null;
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
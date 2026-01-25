import { and, eq, sql, desc } from 'drizzle-orm';
import { db } from '../drizzle';
import { user, tokenAccount, tokenLedger } from '../schema/index';

// Token system queries
export async function getUserWithTokenBalance(userId: string) {
  const result = await db
    .select({
      user: user,
      tokenAccount: tokenAccount,
    })
    .from(user)
    .leftJoin(tokenAccount, eq(user.id, tokenAccount.userId))
    .where(eq(user.id, userId))
    .limit(1);

  return result[0];
}

export async function getTokenBalance(userId: string) {
  const result = await db
    .select({ balance: tokenAccount.balance })
    .from(tokenAccount)
    .where(eq(tokenAccount.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0].balance : 0;
}

// Check if user has sufficient tokens for a generation
export async function hasEnoughTokens(userId: string, requiredTokens: number): Promise<boolean> {
  const balance = await getTokenBalance(userId);
  return balance >= requiredTokens;
}

// Token ledger operations (with idempotency)
export async function appendTokenLedgerEntry(
  userId: string,
  delta: number,
  reason: string,
  referenceId?: string
) {
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
    const newBalance = currentBalance + delta;

    if (newBalance < 0) {
      throw new Error('Insufficient token balance');
    }

    // Insert ledger entry (with idempotency check if referenceId provided)
    const ledgerEntry = await tx
      .insert(tokenLedger)
      .values({
        userId,
        delta,
        reason,
        referenceId,
        balanceAfter: newBalance,
      })
      .returning()
      .onConflictDoNothing();

    if (ledgerEntry.length === 0 && referenceId) {
      // Entry already exists with this referenceId - return existing entry
      const existing = await tx
        .select()
        .from(tokenLedger)
        .where(and(eq(tokenLedger.reason, reason), eq(tokenLedger.referenceId, referenceId)))
        .limit(1);
      return existing[0];
    }

    // Update token account balance
    await tx
      .update(tokenAccount)
      .set({ balance: newBalance })
      .where(eq(tokenAccount.userId, userId));

    return ledgerEntry[0];
  });
}

// Get ledger entry by referenceId and reason
export async function getLedgerEntryByReference(referenceId: string, reason: string) {
  const result = await db
    .select()
    .from(tokenLedger)
    .where(and(eq(tokenLedger.referenceId, referenceId), eq(tokenLedger.reason, reason)))
    .orderBy(desc(tokenLedger.occurredAt))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function createOrUpdateTokenAccount(
  userId: string,
  data: {
    balance?: number;
    planCode?: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    stripeProductId?: string;
    stripePriceId?: string;
    subscriptionStatus?: string;
  }
) {
  const existingAccount = await db
    .select()
    .from(tokenAccount)
    .where(eq(tokenAccount.userId, userId))
    .limit(1);

  if (existingAccount.length === 0) {
    // Create new token account
    const newAccount = await db
      .insert(tokenAccount)
      .values({
        userId,
        balance: data.balance ?? 0,
        planCode: data.planCode ?? 'FREE',
        stripeCustomerId: data.stripeCustomerId,
        stripeSubscriptionId: data.stripeSubscriptionId,
        stripeProductId: data.stripeProductId,
        stripePriceId: data.stripePriceId,
        subscriptionStatus: data.subscriptionStatus,
      })
      .returning();
    
    return newAccount[0];
  } else {
    // Update existing account
    const updatedAccount = await db
      .update(tokenAccount)
      .set(data)
      .where(eq(tokenAccount.userId, userId))
      .returning();
    
    return updatedAccount[0];
  }
}
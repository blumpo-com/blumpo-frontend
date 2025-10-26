import { desc, and, eq, isNull, sql } from 'drizzle-orm';
import { db } from './drizzle';
import { user, tokenAccount, tokenLedger, generationJob, assetImage, authOtp } from './schema/index';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/session';

// Authentication and user management
export async function getUser() {
  const sessionCookie = (await cookies()).get('session');
  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  const sessionData = await verifyToken(sessionCookie.value);
  if (
    !sessionData ||
    !sessionData.user ||
    typeof sessionData.user.id !== 'string'
  ) {
    return null;
  }

  if (new Date(sessionData.expires) < new Date()) {
    return null;
  }

  const result = await db
    .select()
    .from(user)
    .where(and(eq(user.id, sessionData.user.id), eq(user.banFlag, false)))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  return result[0];
}

export async function getUserByEmail(email: string) {
  const result = await db
    .select()
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

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

// Generation job operations
export async function createGenerationJob(
  userId: string,
  jobData: {
    id: string;
    prompt: string;
    params: any;
    tokensCost: number;
  }
) {
  return await db.transaction(async (tx) => {
    // Deduct tokens first
    const ledgerEntry = await appendTokenLedgerEntry(
      userId,
      -jobData.tokensCost,
      'GENERATION',
      jobData.id
    );

    // Create generation job
    const job = await tx
      .insert(generationJob)
      .values({
        ...jobData,
        userId,
        ledgerId: ledgerEntry.id,
      })
      .returning();

    return job[0];
  });
}

export async function getGenerationJobsForUser(userId: string, limit = 20) {
  return await db
    .select({
      job: generationJob,
      assetCount: sql<number>`count(${assetImage.id})::int`,
    })
    .from(generationJob)
    .leftJoin(assetImage, eq(generationJob.id, assetImage.jobId))
    .where(eq(generationJob.userId, userId))
    .groupBy(generationJob.id)
    .orderBy(desc(generationJob.createdAt))
    .limit(limit);
}

export async function updateGenerationJobStatus(
  jobId: string,
  status: 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELED',
  errorCode?: string,
  errorMessage?: string
) {
  const updates: any = {
    status,
    completedAt: new Date(),
  };

  if (status === 'RUNNING') {
    updates.startedAt = new Date();
    delete updates.completedAt;
  }

  if (errorCode) updates.errorCode = errorCode;
  if (errorMessage) updates.errorMessage = errorMessage;

  await db
    .update(generationJob)
    .set(updates)
    .where(eq(generationJob.id, jobId));
}

// Asset operations
export async function attachAssetToJob(
  jobId: string,
  userId: string,
  assetData: {
    id: string;
    title?: string;
    description?: string;
    storageKey: string;
    publicUrl?: string;
    mimeType: string;
    bytesSize: number;
    width: number;
    height: number;
    format: string;
    sha256?: string;
    safetyFlags?: any[];
  }
) {
  const asset = await db
    .insert(assetImage)
    .values({
      ...assetData,
      jobId,
      userId,
      safetyFlags: assetData.safetyFlags || [],
    })
    .returning();

  return asset[0];
}

export async function getAssetsForUser(userId: string, limit = 50) {
  return await db
    .select()
    .from(assetImage)
    .where(and(eq(assetImage.userId, userId), eq(assetImage.isDeleted, false)))
    .orderBy(desc(assetImage.createdAt))
    .limit(limit);
}

// OTP operations
export async function createAuthOtp(
  email: string,
  codeHash: string,
  purpose: string = 'LOGIN',
  expiresAt: Date,
  userId?: string
) {
  const otp = await db
    .insert(authOtp)
    .values({
      id: crypto.randomUUID(),
      email,
      userId,
      codeHash,
      purpose,
      expiresAt,
    })
    .returning();

  return otp[0];
}

export async function findValidOtp(email: string, purpose: string = 'LOGIN') {
  return await db
    .select()
    .from(authOtp)
    .where(
      and(
        eq(authOtp.email, email),
        eq(authOtp.purpose, purpose),
        isNull(authOtp.consumedAt),
        sql`${authOtp.expiresAt} > NOW()`,
        sql`${authOtp.attempts} < ${authOtp.maxAttempts}`
      )
    )
    .orderBy(desc(authOtp.createdAt))
    .limit(1);
}

export async function consumeOtp(otpId: string) {
  await db
    .update(authOtp)
    .set({ consumedAt: new Date() })
    .where(eq(authOtp.id, otpId));
}

export async function incrementOtpAttempts(otpId: string) {
  await db
    .update(authOtp)
    .set({ attempts: sql`${authOtp.attempts} + 1` })
    .where(eq(authOtp.id, otpId));
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

export async function createOrUpdateTokenAccount(
  userId: string,
  data: {
    balance?: number;
    planCode?: string;
    tokensPerPeriod?: number;
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
        tokensPerPeriod: data.tokensPerPeriod ?? 50,
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

import { desc, and, eq, isNull, sql } from 'drizzle-orm';
import { db } from '../drizzle';
import { authOtp } from '../schema/index';

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
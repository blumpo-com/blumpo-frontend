'use server';

import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { user, tokenAccount } from '@/lib/db/schema';
import { type NewUser } from '@/lib/db/schema';
import { setSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getUserByEmail } from '@/lib/db/queries';
import {
  validatedAction,
} from '@/lib/auth/middleware';
import { generateAndSendOtp, verifyAndConsumeOtp } from '@/lib/auth/otp';

// Step 1: Request OTP code
const signInSchema = z.object({
  email: z.string().email().min(3).max(255),
});

export const signIn = validatedAction(signInSchema, async (data, formData) => {
  const { email } = data;

  // Check if user exists
  const existingUser = await getUserByEmail(email);

  if (!existingUser) {
    return {
      error: 'No account found with this email. Please sign up first.',
      email
    };
  }

  // Generate and send OTP
  const result = await generateAndSendOtp(email, 'LOGIN', existingUser.displayName, existingUser.id);

  if (!result.success) {
    return {
      error: result.error || 'Failed to send verification code. Please try again.',
      email
    };
  }

  return {
    success: 'Verification code sent! Please check your email.',
    email,
    awaitingOtp: true
  };
});

// Step 2: Verify OTP and complete sign-in
const verifySignInSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, 'Code must be 6 digits')
});

export const verifySignIn = validatedAction(verifySignInSchema, async (data, formData) => {
  const { email, code } = data;

  // Verify OTP
  const result = await verifyAndConsumeOtp(email, code, 'LOGIN');

  if (!result.success) {
    return {
      error: result.error || 'Invalid verification code.',
      email,
      code
    };
  }

  // Get user and create session
  const foundUser = await getUserByEmail(email);
  if (!foundUser) {
    return {
      error: 'User not found.',
      email,
      code
    };
  }

  // Update last login timestamp
  await db
    .update(user)
    .set({ lastLoginAt: new Date() })
    .where(eq(user.id, foundUser.id));

  await setSession(foundUser);

  const redirectTo = formData.get('redirect') as string | null;
  redirect(redirectTo === 'checkout' ? '/pricing' : '/dashboard');
});

// Step 1: Request OTP for signup
const signUpSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1, 'Name is required').max(100),
  phoneNumber: z.string().optional()
});

export const signUp = validatedAction(signUpSchema, async (data, formData) => {
  const { email, displayName, phoneNumber } = data;

  // Check if user already exists
  const existingUser = await getUserByEmail(email);

  if (existingUser) {
    return {
      error: 'An account with this email already exists. Please sign in instead.',
      email,
      displayName,
      phoneNumber
    };
  }

  // Generate and send OTP
  const result = await generateAndSendOtp(email, 'SIGNUP', displayName);

  if (!result.success) {
    return {
      error: result.error || 'Failed to send verification code. Please try again.',
      email,
      displayName,
      phoneNumber
    };
  }

  return {
    success: 'Verification code sent! Please check your email.',
    email,
    displayName,
    phoneNumber,
    awaitingOtp: true
  };
});

// Step 2: Verify OTP and complete signup
const verifySignUpSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1).max(100),
  phoneNumber: z.string().optional(),
  code: z.string().length(6, 'Code must be 6 digits')
});

export const verifySignUp = validatedAction(verifySignUpSchema, async (data, formData) => {
  const { email, displayName, phoneNumber, code } = data;

  // Verify OTP
  const result = await verifyAndConsumeOtp(email, code, 'SIGNUP');

  if (!result.success) {
    return {
      error: result.error || 'Invalid verification code.',
      email,
      displayName,
      phoneNumber,
      code
    };
  }

  // Check again if user exists (race condition protection)
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    return {
      error: 'An account with this email already exists.',
      email,
      displayName,
      phoneNumber,
      code
    };
  }

  // Create new user
  const newUser: NewUser = {
    id: crypto.randomUUID(),
    email,
    displayName,
    phoneNumber: phoneNumber || null,
  };

  const [createdUser] = await db.insert(user).values(newUser).returning();

  if (!createdUser) {
    return {
      error: 'Failed to create user. Please try again.',
      email,
      displayName,
      phoneNumber,
      code
    };
  }

  // Create default token account with free tier (10,000 tokens)
  await db.insert(tokenAccount).values({
    userId: createdUser.id,
    balance: 10000,
    planCode: 'FREE',
  });

  // Set session
  await setSession(createdUser);

  const redirectTo = formData.get('redirect') as string | null;
  redirect(redirectTo === 'checkout' ? '/pricing' : '/dashboard');
});

export async function signOut() {
  (await cookies()).delete('session');
  redirect('/sign-in');
}

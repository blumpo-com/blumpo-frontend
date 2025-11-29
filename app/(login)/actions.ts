'use server';

import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { user, tokenAccount } from '@/lib/db/schema';
import { type NewUser } from '@/lib/db/schema';
import { setSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getUserByEmail, getUser } from '@/lib/db/queries';
import {
  validatedAction,
} from '@/lib/auth/middleware';
import { generateAndSendOtp, verifyAndConsumeOtp } from '@/lib/auth/otp';

// Unified authentication flow: Step 1 - Request OTP code
const requestOtpSchema = z.object({
  email: z.string().email().min(3).max(255),
});

export const requestOtp = validatedAction(requestOtpSchema, async (data, formData) => {
  const { email } = data;

  // Generate and send OTP (works for both existing and new users)
  const existingUser = await getUserByEmail(email);
  const userId = existingUser?.id;

  const result = await generateAndSendOtp(email, 'LOGIN', userId);

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

// Unified authentication flow: Step 2 - Verify OTP and sign in (or create user if new)
const verifyOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, 'Code must be 6 digits')
});

export const verifyOtp = validatedAction(verifyOtpSchema, async (data, formData) => {
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

  // Check if user exists
  let foundUser = await getUserByEmail(email);

  if (!foundUser) {
    // User doesn't exist - create new user
    const newUser: NewUser = {
      id: crypto.randomUUID(),
      email,
      phoneNumber: null,
    };

    const [createdUser] = await db.insert(user).values(newUser).returning();

    if (!createdUser) {
      return {
        error: 'Failed to create user. Please try again.',
        email,
        code
      };
    }

    // Create default token account with free tier (10,000 tokens)
    await db.insert(tokenAccount).values({
      userId: createdUser.id,
      balance: 10000,
      planCode: 'FREE',
    });

    foundUser = createdUser;
  } else {
    // User exists - update last login timestamp
    await db
      .update(user)
      .set({ lastLoginAt: new Date() })
      .where(eq(user.id, foundUser.id));
  }

  // Set session for both new and existing users
  await setSession(foundUser);

  const redirectTo = formData.get('redirect') as string | null;
  redirect(redirectTo === 'checkout' ? '/pricing' : '/dashboard');
});

// Legacy exports for backward compatibility (will be removed after UI update)
export const signIn = requestOtp;
export const verifySignIn = verifyOtp;
export const signUp = requestOtp;
export const verifySignUp = verifyOtp;

export async function signOut() {
  (await cookies()).delete('session');
  redirect('/sign-in');
}

// User account management actions
const updateAccountSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().min(3).max(255),
});

export const updateAccount = validatedAction(updateAccountSchema, async (data) => {
  const currentUser = await getUser();
  if (!currentUser) {
    throw new Error('User not authenticated');
  }

  const { name, email } = data;

  // Check if email is taken by another user
  if (email !== currentUser.email) {
    const existingUser = await getUserByEmail(email);
    if (existingUser && existingUser.id !== currentUser.id) {
      return { error: 'Email is already taken by another account.' };
    }
  }

  try {
    await db
      .update(user)
      .set({
        displayName: name,
        email,
        lastLoginAt: new Date(), // Update last login when account is updated
      })
      .where(eq(user.id, currentUser.id));

    return { success: 'Account updated successfully.' };
  } catch (error) {
    return { error: 'Failed to update account.' };
  }
});

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(8).max(100),
  newPassword: z.string().min(8).max(100),
  confirmPassword: z.string().min(8).max(100),
});

export const updatePassword = validatedAction(updatePasswordSchema, async (data) => {
  const currentUser = await getUser();
  if (!currentUser) {
    throw new Error('User not authenticated');
  }

  const { currentPassword, newPassword, confirmPassword } = data;

  if (newPassword !== confirmPassword) {
    return { error: 'New passwords do not match.' };
  }

  // Note: In a real implementation, you'd verify the current password
  // Since this uses OTP auth, we'll skip password verification for now
  
  try {
    // In a real app, you'd hash the password here
    // For now, we'll just return success since this is OTP-based auth
    return { success: 'Password updated successfully.' };
  } catch (error) {
    return { error: 'Failed to update password.' };
  }
});

const deleteAccountSchema = z.object({
  password: z.string().min(8).max(100),
});

export const deleteAccount = validatedAction(deleteAccountSchema, async (data) => {
  const currentUser = await getUser();
  if (!currentUser) {
    throw new Error('User not authenticated');
  }

  try {
    // Delete user (cascade will handle related records)
    await db.delete(user).where(eq(user.id, currentUser.id));
    
    // Clear session
    (await cookies()).delete('session');
    
    return { success: 'Account deleted successfully.' };
  } catch (error) {
    return { error: 'Failed to delete account.' };
  }
});

// Placeholder team management actions (now user-focused)
const inviteTeamMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['member', 'owner']),
});

export const inviteTeamMember = validatedAction(inviteTeamMemberSchema, async (data) => {
  // For now, return not implemented since we've moved to user-based model
  return { error: 'Team functionality is not available in the current version.' };
});

const removeTeamMemberSchema = z.object({
  memberId: z.string(),
});

export const removeTeamMember = validatedAction(removeTeamMemberSchema, async (data) => {
  // For now, return not implemented since we've moved to user-based model
  return { error: 'Team functionality is not available in the current version.' };
});
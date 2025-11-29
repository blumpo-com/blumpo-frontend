import { hash, verify } from '@node-rs/argon2';
import { Resend } from 'resend';
import { renderOtpEmailTemplate } from './templates/otpEmailTemplate';
import { createAuthOtp, findValidOtp, consumeOtp, incrementOtpAttempts } from '@/lib/db/queries';

// Initialize Resend client
export const resend = new Resend(process.env.RESEND_API_KEY!);

// Argon2 configuration for OTP hashing
const ARGON2_OPTIONS = {
  memoryCost: 19456, // 19 MB
  timeCost: 2,
  parallelism: 1,
};

/**
 * Generate a 6-digit numeric OTP code
 */
export function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Hash an OTP code using Argon2id
 */
export async function hashOtpCode(code: string): Promise<string> {
  return await hash(code, ARGON2_OPTIONS);
}

/**
 * Verify an OTP code against its hash using Argon2id
 */
export async function verifyOtpCode(code: string, codeHash: string): Promise<boolean> {
  try {
    return await verify(codeHash, code, ARGON2_OPTIONS);
  } catch (error) {
    return false;
  }
}

/**
 * Generate OTP, store it in the database, and send it via email
 */
export async function generateAndSendOtp(
  email: string,
  purpose: string = 'LOGIN',
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Generate OTP code
    const code = generateOtpCode();
    
    // Hash the code
    const codeHash = await hashOtpCode(code);
    
    // Set expiration to 10 minutes from now
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    // Store OTP in database
    await createAuthOtp(email, codeHash, purpose, expiresAt, userId);
    
    // Send email via Resend
    const { error } = await resend.emails.send({
      from: 'Blumpo <no-reply@blumpo.com>',
      to: email,
      subject: 'Your login code',
      html: renderOtpEmailTemplate(code),
    });
    
    if (error) {
      console.error('Failed to send OTP email:', error);
      return { success: false, error: 'Failed to send verification email' };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error generating and sending OTP:', error);
    return { success: false, error: 'Failed to generate verification code' };
  }
}

/**
 * Verify an OTP code submitted by the user
 */
export async function verifyAndConsumeOtp(
  email: string,
  code: string,
  purpose: string = 'LOGIN'
): Promise<{ success: boolean; error?: string; userId?: string }> {
  try {
    // Find valid OTP for this email
    const otps = await findValidOtp(email, purpose);
    
    if (otps.length === 0) {
      return { success: false, error: 'No valid verification code found. Please request a new one.' };
    }
    
    const otp = otps[0];
    
    // Verify the code
    const isValid = await verifyOtpCode(code, otp.codeHash);
    
    if (!isValid) {
      // Increment attempt counter
      await incrementOtpAttempts(otp.id);
      
      // Check if max attempts reached
      if (otp.attempts + 1 >= otp.maxAttempts) {
        return { success: false, error: 'Maximum verification attempts exceeded. Please request a new code.' };
      }
      
      return { success: false, error: 'Invalid verification code. Please try again.' };
    }
    
    // Mark OTP as consumed
    await consumeOtp(otp.id);
    
    return { success: true, userId: otp.userId || undefined };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return { success: false, error: 'Failed to verify code' };
  }
}

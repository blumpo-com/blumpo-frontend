# Authentication System

## Overview

This application uses a **passwordless authentication system** based on one-time PIN (OTP) codes sent via email. Users never need to remember or manage passwords - instead, they receive a verification code in their email each time they log in.

## Key Features

- **Passwordless Authentication**: No passwords to remember or manage
- **Email-based OTP**: 6-digit verification codes sent via Resend
- **Secure Hashing**: OTP codes are hashed using Argon2id before storage
- **Time-limited Codes**: Codes expire after 10 minutes
- **Attempt Limiting**: Maximum of 5 verification attempts per code
- **Two-step Flow**: Request code → Verify code

## Environment Variables

The authentication system requires the following environment variable:

```env
RESEND_API_KEY=re_your_api_key_here
AUTH_SECRET=your_secret_key_here
```

- **RESEND_API_KEY**: API key from [Resend](https://resend.com) for sending email
- **AUTH_SECRET**: Secret key for signing JWT session tokens (generate with `openssl rand -hex 32`)

## How It Works

### Sign Up Flow

1. User enters email, display name, and optional phone number
2. System checks if email already exists
3. If new user, generates a 6-digit OTP code
4. Hashes the code with Argon2id and stores it in the `auth_otp` table
5. Sends the code to the user's email via Resend
6. User enters the code from their email
7. System verifies the code and creates the user account
8. Creates a default token account with 10,000 free tokens
9. Sets a JWT session cookie and redirects to dashboard

### Sign In Flow

1. User enters their email address
2. System checks if user exists
3. If user exists, generates a 6-digit OTP code
4. Hashes the code with Argon2id and stores it in the `auth_otp` table
5. Sends the code to the user's email via Resend
6. User enters the code from their email
7. System verifies the code and creates a session
8. Updates `lastLoginAt` timestamp
9. Sets a JWT session cookie and redirects to dashboard

### Sign Out Flow

Simple session cookie deletion and redirect to sign-in page.

## Security Features

### OTP Security

- **Hashing**: All OTP codes are hashed using Argon2id (the most secure hashing algorithm) before storage
- **Never Stored Plain**: The actual 6-digit code is never stored in the database
- **Time-limited**: Codes expire 10 minutes after generation
- **Attempt Limiting**: Maximum 5 attempts per code
- **Single Use**: Once consumed, codes cannot be reused

### Argon2 Configuration

```typescript
{
  memoryCost: 19456,  // 19 MB memory usage
  timeCost: 2,         // 2 iterations
  parallelism: 1       // Single-threaded
}
```

### Session Management

- JWT tokens signed with HS256
- Tokens expire after 1 day
- HTTP-only cookies (not accessible via JavaScript)
- Secure flag enabled in production
- SameSite=Lax for CSRF protection

## Database Schema

### `auth_otp` Table

Stores OTP verification codes for authentication:

```typescript
{
  id: uuid,              // Primary key
  email: text,           // User's email address
  userId: uuid?,         // Optional link to user (for sign-in)
  codeHash: text,        // Argon2 hash of the 6-digit code
  purpose: text,         // 'LOGIN' or 'SIGNUP'
  createdAt: timestamp,  // When code was generated
  expiresAt: timestamp,  // When code expires (10 minutes)
  consumedAt: timestamp?, // When code was successfully used
  attempts: number,      // Number of verification attempts
  maxAttempts: number,   // Maximum allowed attempts (5)
  resendCount: number,   // Number of times code was resent
  ipAddress: inet?,      // Optional IP for rate limiting
  userAgent: text?       // Optional user agent
}
```

## Usage Example

### Sending OTP

```typescript
import { generateAndSendOtp } from '@/lib/auth/otp';

// For sign-up
const result = await generateAndSendOtp(email, 'SIGNUP', displayName);

// For sign-in
const result = await generateAndSendOtp(email, 'LOGIN', displayName, userId);

if (result.success) {
  // Code sent successfully
} else {
  // Handle error: result.error
}
```

### Verifying OTP

```typescript
import { verifyAndConsumeOtp } from '@/lib/auth/otp';

const result = await verifyAndConsumeOtp(email, code, 'LOGIN');

if (result.success) {
  // Code verified - proceed with login
  const userId = result.userId;
} else {
  // Handle error: result.error
}
```

## Email Template

The OTP email is styled with inline CSS and includes:

- Personalized greeting (if display name provided)
- Large, bold 6-digit code
- Expiration notice (10 minutes)
- Safety disclaimer

The template is defined in `/lib/auth/templates/otpEmailTemplate.ts` and can be customized.

## API Actions

### Server Actions

All authentication actions are server actions defined in `app/(login)/actions.ts`:

- **signIn(formData)**: Request OTP for sign-in
- **verifySignIn(formData)**: Verify OTP and complete sign-in
- **signUp(formData)**: Request OTP for sign-up
- **verifySignUp(formData)**: Verify OTP and complete sign-up
- **signOut()**: Clear session and redirect

## Components

### Login Component

The `Login` component (`app/(login)/login.tsx`) provides:

- Two-step UI flow (request → verify)
- Email input for both sign-in and sign-up
- Display name and phone number fields for sign-up
- 6-digit code input with auto-focus
- Error and success message display
- Toggle between sign-in and sign-up modes

## Rate Limiting & Abuse Prevention

Current implementation includes:

- Maximum 5 verification attempts per code
- Codes expire after 10 minutes
- Optional IP address tracking for future rate limiting

**Recommended additions** for production:

- Rate limit OTP requests per email (e.g., max 3 per hour)
- Rate limit by IP address
- CAPTCHA for repeated failures
- Email verification for new accounts
- Monitor and flag suspicious patterns

## Migration from Password-based Auth

If migrating from a password-based system:

1. Remove `passwordHash` column from user table
2. Update all auth-related code to use OTP flow
3. Remove password validation/hashing functions
4. Update UI to remove password fields
5. Notify users about the change
6. Consider a grace period with both systems running

## Troubleshooting

### Email Not Received

- Check Resend API key is valid
- Verify sender domain is configured in Resend
- Check spam/junk folders
- Verify email address is correct
- Check Resend dashboard for delivery status

### Code Expired

- Codes expire after 10 minutes
- User must request a new code
- Consider implementing "Resend Code" button

### Code Invalid

- Check for typos in the 6-digit code
- Verify code hasn't been used already
- Check attempt counter hasn't exceeded maximum
- Ensure code hasn't expired

### Session Issues

- Verify `AUTH_SECRET` environment variable is set
- Check cookie settings (httpOnly, secure, sameSite)
- Ensure cookies are enabled in browser
- Check for clock skew between client and server

## Best Practices

1. **Always use HTTPS in production** - Required for secure cookies
2. **Monitor OTP usage patterns** - Detect abuse early
3. **Set up email alerts** - For failed delivery or rate limit violations
4. **Test email deliverability** - Regularly check spam scores
5. **Keep Argon2 updated** - Use the latest secure version
6. **Rotate AUTH_SECRET periodically** - Invalidates old sessions
7. **Log authentication events** - For audit and debugging

## Future Enhancements

Potential improvements to consider:

- SMS-based OTP as an alternative to email
- Backup codes for account recovery
- Remember device/browser functionality
- Biometric authentication on mobile
- WebAuthn/Passkey support
- Magic links as an alternative to OTP
- 2FA with authenticator apps

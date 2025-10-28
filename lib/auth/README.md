# Authentication System

## Overview

This application uses a **hybrid authentication system** that supports both:
1. **Passwordless OTP Authentication** - Email-based one-time codes via Resend
2. **Google OAuth Sign-In** - Single sign-on with Google accounts via NextAuth

Users can choose either method to sign in. Both integrate seamlessly with the same user database.

---

## 🔐 Authentication Methods

### 1. Passwordless OTP (Email)

- **No passwords**: Users receive 6-digit verification codes via email
- **Secure Hashing**: OTP codes are hashed using Argon2id before storage
- **Time-limited**: Codes expire after 10 minutes
- **Attempt Limiting**: Maximum of 5 verification attempts per code
- **Two-step Flow**: Request code → Verify code

### 2. Google OAuth

- **Single Sign-On**: Sign in with existing Google accounts
- **Automatic Setup**: User accounts created automatically on first sign-in
- **Profile Sync**: Name, email, and profile photo imported from Google
- **No Extra Tables**: JWT-based sessions (no database session storage needed)

---

## 🚀 Setup Instructions

### Prerequisites

- **Resend Account**: For sending OTP emails - [resend.com](https://resend.com)
- **Google Cloud Console**: For OAuth credentials - [console.cloud.google.com](https://console.cloud.google.com)
- **PostgreSQL Database**: Configured and running

### Google OAuth Setup

#### Step 1: Create OAuth Client in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**

5. **Configure OAuth Consent Screen** (if first time):
   - User Type: **External** (for public) or **Internal** (workspace only)
   - App name: Your app name (e.g., "Blumpo")
   - User support email: Your email
   - Developer contact: Your email
   - Scopes: Add `userinfo.email` and `userinfo.profile`
   - Test users: Add your email for testing

6. **Create OAuth Client**:
   - Application type: **Web application**
   - Name: Your app name + "Web Client"
   - **Authorized redirect URIs** (CRITICAL):
     - Development: `http://localhost:3000/api/auth/callback/google`
     - Production: `https://yourdomain.com/api/auth/callback/google`

7. **Copy credentials**: Save the Client ID and Client Secret

**⚠️ Common Issue**: Make sure to click **SAVE** after adding redirect URIs!

#### Step 2: Configure Environment Variables

Update your `.env` file:

```env
# Existing variables (keep these)
POSTGRES_URL=postgres://postgres:postgres@localhost:54322/postgres
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
BASE_URL=http://localhost:3000
RESEND_API_KEY=re_...
AUTH_SECRET=your_auth_secret_here

# Google OAuth (add these)
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your_client_secret

# NextAuth (add these)
NEXTAUTH_SECRET=your_nextauth_secret_here
```

**Generate secrets**:
```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate AUTH_SECRET (if not set)
openssl rand -hex 32
```

#### Step 3: Production Setup

For production deployment:

1. **Add production redirect URI** to Google Cloud Console:
   ```
   https://yourdomain.com/api/auth/callback/google
   ```

2. **Update environment variables** on your hosting platform:
   ```env
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   NEXTAUTH_SECRET=your_nextauth_secret
   ```

---

## Environment Variables

| Variable | Required | Purpose | Example |
|----------|----------|---------|---------|
| `RESEND_API_KEY` | Yes | Send OTP emails | `re_...` |
| `AUTH_SECRET` | Yes | Sign OTP JWT sessions | Generate: `openssl rand -hex 32` |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID | `123...apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth secret | `GOCSPX-...` |
| `NEXTAUTH_SECRET` | Yes | Sign NextAuth JWT tokens | Generate: `openssl rand -base64 32` |
| `POSTGRES_URL` | Yes | Database connection | `postgres://user:pass@host:port/db` |

---

## 🏗️ Architecture

### File Structure

```
app/
├── api/
│   └── auth/
│       └── [...nextauth]/
│           └── route.ts          # NextAuth API routes for OAuth
├── (login)/
│   ├── actions.ts                # Server actions (OTP + OAuth)
│   ├── login.tsx                 # Login UI with both methods
│   ├── sign-in/
│   │   └── page.tsx
│   └── sign-up/
│       └── page.tsx
├── providers.tsx                  # SessionProvider wrapper
└── layout.tsx                     # Root layout with Providers
lib/
├── auth/
│   ├── nextauth.ts               # NextAuth config for OAuth
│   ├── otp.ts                    # OTP generation/verification
│   ├── session.ts                # JWT session management
│   └── templates/
│       └── otpEmailTemplate.ts   # OTP email template
types/
└── next-auth.d.ts                # NextAuth TypeScript types
```

### Authentication Flows

#### Google OAuth Flow

1. User clicks "Continue with Google" button
2. `signIn('google')` called from next-auth/react
3. NextAuth redirects to Google OAuth consent screen
4. User authorizes the app with their Google account
5. Google redirects back to `/api/auth/callback/google`
6. NextAuth processes callback:
   - Checks if user exists in database by email
   - **New user**: Creates user record + token account with 10,000 free tokens
   - **Existing user**: Updates `lastLoginAt` and profile photo
7. Creates JWT session with user data
8. Redirects to `/dashboard`

#### OTP Sign-Up Flow

1. User enters email, display name, and optional phone number
2. System checks if email already exists
3. If new user, generates a 6-digit OTP code
4. Hashes the code with Argon2id and stores it in the `auth_otp` table
5. Sends the code to the user's email via Resend
6. User enters the code from their email
7. System verifies the code and creates the user account
8. Creates a default token account with 10,000 free tokens
9. Sets a JWT session cookie and redirects to dashboard

#### OTP Sign-In Flow

1. User enters their email address
2. System checks if user exists
3. If user exists, generates a 6-digit OTP code
4. Hashes the code with Argon2id and stores it in the `auth_otp` table
5. Sends the code to the user's email via Resend
6. User enters the code from their email
7. System verifies the code and creates a session
8. Updates `lastLoginAt` timestamp
9. Sets a JWT session cookie and redirects to dashboard

#### Sign-Out Flow

Works for both authentication methods - clears session cookie and redirects to sign-in page.

---

## 🗄️ Database Schema

### User Table

Both authentication methods use the same `user` table:

```typescript
{
  id: uuid,              // Primary key
  email: text,           // Unique email address
  displayName: text,     // User's display name
  photoUrl: text?,       // Profile photo (from Google OAuth)
  phoneNumber: text?,    // Optional phone number
  createdAt: timestamp,  // Account creation date
  lastLoginAt: timestamp?, // Last login timestamp
  banFlag: boolean,      // Account ban status
}
```

**Key Points:**
- Google OAuth users get `photoUrl` from their Google profile
- Display name defaults to Google name or email prefix
- First-time sign-in (both methods) creates token account with 10,000 free tokens
- No duplicate accounts - users matched by email address

### Auth OTP Table

Stores temporary OTP verification codes:

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

---

## 🔒 Security Features

### OAuth Security

- **Redirect URI Validation**: Exact redirect URIs whitelisted in Google Console
- **State Parameter**: Automatically handled by NextAuth to prevent CSRF
- **HTTPS Required**: Production OAuth must use HTTPS
- **Client Secret**: Never exposed client-side or committed to git

### OTP Security

- **Argon2id Hashing**: Most secure hashing algorithm for OTP codes
- **Never Stored Plain**: Actual 6-digit codes never stored in database
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

#### NextAuth JWT Sessions (OAuth)

- **Strategy**: JWT (no database sessions)
- **Duration**: 30 days
- **Storage**: HTTP-only secure cookies
- **Data**: `{ user: { id, email, name, image } }`

#### Custom JWT Sessions (OTP)
```

### Session Management

- JWT tokens signed with HS256
- Tokens expire after 1 day
- HTTP-only cookies (not accessible via JavaScript)
- Secure flag enabled in production
- SameSite=Lax for CSRF protection

**Note**: Both session types coexist but are separate. OAuth users use NextAuth sessions, OTP users use custom JWT sessions.

---

## 🎨 UI Components

### Login Component

The login page (`app/(login)/login.tsx`) provides:

1. **Email/OTP Form** - Two-step flow (email → verification code)
2. **Divider** - "Or continue with" separator
3. **Google Sign-In Button** - With Google logo, uses `signIn('google')`
4. **Mode Toggle** - Switch between sign-in and sign-up

### Usage Examples

#### Client-Side: Check Session (OAuth)

```typescript
'use client';
import { useSession } from 'next-auth/react';

export function UserProfile() {
  const { data: session, status } = useSession();

  if (status === 'loading') return <div>Loading...</div>;
  if (!session) return <div>Not signed in</div>;

  return <div>Hello {session.user.name}!</div>;
}
```

#### Server-Side: Get Session (OAuth)

```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';

export default async function Page() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/sign-in');
  }

  return <div>Welcome, {session.user.email}!</div>;
}
```

#### Sign Out (Works for Both)

```typescript
'use client';
import { signOut } from 'next-auth/react';

export function SignOutButton() {
  return (
    <button onClick={() => signOut({ callbackUrl: '/sign-in' })}>
      Sign Out
    </button>
  );
}
```

---

## 📝 API Actions

### Server Actions (OTP)

All OTP actions are defined in `app/(login)/actions.ts`:

- **signIn(formData)**: Request OTP for sign-in
- **verifySignIn(formData)**: Verify OTP and complete sign-in
- **signUp(formData)**: Request OTP for sign-up
- **verifySignUp(formData)**: Verify OTP and complete sign-up
- **signOut()**: Clear session and redirect

### OTP Functions

```typescript
import { generateAndSendOtp, verifyAndConsumeOtp } from '@/lib/auth/otp';

// Send OTP
const result = await generateAndSendOtp(email, 'LOGIN', displayName, userId);

// Verify OTP
const result = await verifyAndConsumeOtp(email, code, 'LOGIN');
```

---

## 🧪 Testing

### Test Google OAuth

1. Start dev server: `pnpm dev`
2. Go to: `http://localhost:3000/sign-in`
3. Click "Continue with Google"
4. Should redirect to Google consent screen
5. Authorize with your Google account
6. Should redirect to `/dashboard`
7. Check database - user and token account created

### Test OTP Authentication

1. Go to: `http://localhost:3000/sign-in`
2. Enter your email address
3. Check email for 6-digit code
4. Enter code on verification page
5. Should sign in and redirect to `/dashboard`

### Common Issues

#### "Redirect URI mismatch" (Google OAuth)

**Cause**: Redirect URI in Google Console doesn't match actual URL

**Fix**:
1. Go to Google Cloud Console → Credentials
2. Edit your OAuth client
3. Add exact redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Click **SAVE** (critical!)
5. Wait 30 seconds
6. Try again in incognito mode

#### "Email not received" (OTP)

**Cause**: Resend configuration or delivery issue

**Fix**:
- Verify `RESEND_API_KEY` is correct
- Check Resend dashboard for delivery status
- Verify sender domain is configured
- Check spam/junk folders

#### "Code expired" (OTP)

**Cause**: More than 10 minutes passed since code was sent

**Fix**: Request a new code

---

## 🔐 Security Best Practices

### For Production

1. **Always use HTTPS** - Required for secure cookies and OAuth
2. **Rotate secrets periodically** - `NEXTAUTH_SECRET`, `AUTH_SECRET`, etc.
3. **Use different OAuth clients** - Separate development and production
4. **Monitor authentication events** - Log failed attempts, rate limit abuse
5. **Enable 2FA** - On your Google Cloud Console account
6. **Keep dependencies updated** - Especially `next-auth` and security packages

### Rate Limiting Recommendations

Current implementation includes basic attempt limiting. For production, add:

- Rate limit OTP requests per email (e.g., max 3 per hour)
- Rate limit by IP address
- CAPTCHA for repeated failures
- Email verification for new accounts
- Monitor and flag suspicious patterns

---

## 📚 Additional Resources

- **NextAuth Documentation**: [next-auth.js.org](https://next-auth.js.org/)
- **Google OAuth Guide**: [developers.google.com/identity/protocols/oauth2](https://developers.google.com/identity/protocols/oauth2)
- **Resend Documentation**: [resend.com/docs](https://resend.com/docs)
- **Argon2 Info**: [github.com/P-H-C/phc-winner-argon2](https://github.com/P-H-C/phc-winner-argon2)

---

## 🔄 Migration & Extensions

### Adding More OAuth Providers

To add GitHub, Facebook, or other providers:

```typescript
// lib/auth/nextauth.ts
import GitHubProvider from 'next-auth/providers/github';

providers: [
  GoogleProvider({ ... }),
  GitHubProvider({
    clientId: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  }),
],
```

Then add the button to `login.tsx` and configure environment variables.

---

## 🐛 Troubleshooting

### Google OAuth Issues

**Problem**: "Redirect URI mismatch"
- **Solution**: Verify exact URI in Google Console: `http://localhost:3000/api/auth/callback/google`
- Must click SAVE after adding
- Wait 30 seconds for propagation
- Try in incognito mode

**Problem**: No session after Google sign-in
- **Solution**: Check `NEXTAUTH_SECRET` is set in `.env`
- Verify `SessionProvider` wraps your app in `layout.tsx`
- Check browser cookies are enabled

**Problem**: User not created in database
- **Solution**: Check database connection (`POSTGRES_URL`)
- Verify user table exists
- Check server logs for errors

### OTP Issues

**Problem**: Email not received
- **Solution**: Verify `RESEND_API_KEY` is correct
- Check Resend dashboard for delivery status
- Check spam/junk folders
- Verify sender domain is configured

**Problem**: Code expired
- **Solution**: Codes expire after 10 minutes - request new code
- Consider implementing "Resend Code" button

**Problem**: Code invalid
- **Solution**: Check for typos in 6-digit code
- Verify code hasn't been used already
- Check attempt counter (max 5 attempts)
- Ensure code hasn't expired

### Session Issues

- Verify `AUTH_SECRET` and `NEXTAUTH_SECRET` environment variables are set
- Check cookie settings (httpOnly, secure, sameSite)
- Ensure cookies are enabled in browser
- Check for clock skew between client and server

---

## ✅ Quick Reference

### Test Checklist

- [ ] Google OAuth redirects to Google consent screen
- [ ] After Google approval, user is created in database
- [ ] Token account created with 10,000 tokens
- [ ] OTP emails arrive within 30 seconds
- [ ] OTP codes work correctly
- [ ] Sign-out works for both methods
- [ ] Sessions persist across page refreshes

### Environment Variables Checklist

- [ ] `POSTGRES_URL` - Database connection
- [ ] `RESEND_API_KEY` - For OTP emails
- [ ] `AUTH_SECRET` - For OTP JWT sessions
- [ ] `GOOGLE_CLIENT_ID` - Google OAuth
- [ ] `GOOGLE_CLIENT_SECRET` - Google OAuth
- [ ] `NEXTAUTH_SECRET` - For NextAuth JWT sessions

### Production Deployment Checklist

- [ ] Update Google Console with production redirect URI
- [ ] Set all environment variables on hosting platform
- [ ] Verify HTTPS is working
- [ ] Test Google OAuth flow end-to-end
- [ ] Test OTP email delivery
- [ ] Monitor authentication logs
- [ ] Set up rate limiting
- [ ] Enable security headers

---

**Questions or issues?** Check these additional guides:
- `GOOGLE_AUTH_SETUP.md` - Detailed Google OAuth setup
- `TROUBLESHOOTING.md` - Comprehensive troubleshooting guide  
- `FIX_REDIRECT_URI.md` - Fix redirect URI mismatch errors
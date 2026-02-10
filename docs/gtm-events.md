# GTM Events Documentation

This document describes all Google Tag Manager (GTM) events instrumented in the Blumpo frontend application.

## Overview

GTM events are pushed to `window.dataLayer` on the client-side only. All events include SSR guards to ensure they only run in the browser.

## Helper Module

Location: `lib/gtm.ts`

### Functions

- `gtmPush(payload)` - Low-level function to push any payload to dataLayer
- `gtmEvent(eventName, params)` - Convenience wrapper to push an event
- `gtmSetUser({ user_id, user_status })` - Set or update user information

## Events

### Authentication Events

#### `login`
Fired when a user successfully logs in.

**Where fired:**
- After successful OTP email verification (`app/(login)/actions.ts`)
- After successful Google OAuth callback (`app/api/auth/google-callback/route.ts`)
- Detected by `GTMAuthTracker` component in dashboard layout

**Payload:**
```typescript
{
  event: 'login',
  method: 'google' | 'email'
}
```

**Example:**
```typescript
gtmEvent('login', { method: 'google' });
```

---

#### `sign_up`
Fired when a new user successfully signs up.

**Where fired:**
- After OTP verification creates a new user (`app/(login)/actions.ts`)
- After Google OAuth creates a new user (`app/api/auth/google-callback/route.ts`)
- Detected by `GTMAuthTracker` component in dashboard layout

**Payload:**
```typescript
{
  event: 'sign_up',
  method: 'google' | 'email'
}
```

**Example:**
```typescript
gtmEvent('sign_up', { method: 'email' });
```

---

#### `logout`
Fired when a user logs out.

**Where fired:**
- Before calling `signOut` action (`app/(dashboard)/dashboard/general/page.tsx`)

**Payload:**
```typescript
{
  event: 'logout'
}
```

**Example:**
```typescript
gtmEvent('logout', {});
```

---

### Purchase Events

#### `begin_checkout`
Fired when a user initiates checkout (clicks a pricing CTA or starts checkout flow).

**Where fired:**
- When user clicks subscription checkout button (`app/(dashboard)/dashboard/your-credits/page.tsx`)
- When user clicks topup/credits purchase button (`app/(dashboard)/dashboard/your-credits/page.tsx`)
- When user confirms annual plan from Save 50% dialog
- When user continues with monthly plan from Save 50% dialog

**Payload:**
```typescript
{
  event: 'begin_checkout',
  plan?: string,              // Plan code (e.g., 'STARTER', 'GROWTH') or topup name
  price_id: string,          // Stripe price ID
  mode: 'subscription' | 'payment',
  currency?: string,          // e.g., 'usd'
  value?: number             // Amount in dollars (not cents)
}
```

**Example:**
```typescript
gtmEvent('begin_checkout', {
  plan: 'STARTER',
  price_id: 'price_1234567890',
  mode: 'subscription',
  currency: 'usd',
  value: 29.99
});
```

---

#### `purchase`
Fired when a payment is successfully completed.

**Where fired:**
- After successful Stripe checkout redirect (`components/gtm-purchase-tracker.tsx`)
- Triggered by `GTMPurchaseTracker` component on your-credits page
- Verifies session with server API before firing event

**Payload:**
```typescript
{
  event: 'purchase',
  transaction_id: string,    // Stripe checkout session ID
  currency: string,          // e.g., 'usd'
  value: number,             // Total amount in dollars
  plan?: string,             // Plan code or topup name
  mode: 'subscription' | 'payment',
  items?: Array<{
    item_id?: string,
    item_name?: string,
    price?: number,
    quantity?: number
  }>
}
```

**Example:**
```typescript
gtmEvent('purchase', {
  transaction_id: 'cs_test_1234567890',
  currency: 'usd',
  value: 29.99,
  plan: 'STARTER',
  mode: 'subscription',
  items: [{
    item_id: 'prod_123',
    item_name: 'Starter Plan',
    price: 29.99,
    quantity: 1
  }]
});
```

---

## Components

### `GTMAuthTracker`
Location: `components/gtm-auth-tracker.tsx`

Client component that detects auth success from URL params (`?auth=success&method=...&isNewUser=...`) and fires appropriate `login` or `sign_up` events.

**Usage:**
Included in dashboard layout (`app/(dashboard)/dashboard/layout.tsx`).

---

### `GTMPurchaseTracker`
Location: `components/gtm-purchase-tracker.tsx`

Client component that detects purchase success from URL params (`?purchase=success&session_id=...`), verifies the session with the server API, and fires `purchase` event.

**Usage:**
Included in your-credits page (`app/(dashboard)/dashboard/your-credits/page.tsx`).

---

## API Routes

### `/api/stripe/verify-session`
Location: `app/api/stripe/verify-session/route.ts`

Server-side API route that verifies a Stripe checkout session and returns purchase details for GTM tracking.

**Query params:**
- `session_id` - Stripe checkout session ID

**Response:**
```typescript
{
  session_id: string,
  mode: 'subscription' | 'payment',
  currency: string,
  amount_total: number,      // In cents
  plan?: string,
  items: Array<{...}>
}
```

---

## User Data

User information is automatically pushed to `dataLayer` in `app/layout.tsx`:

```typescript
{
  user_id: string,           // User UUID or empty string
  user_status: 'logged_in' | 'guest'
}
```

This data is available for all GTM events and can be used in GTM tags and triggers.

---

## Testing

### Manual Testing Steps

1. **Open DevTools Console**
   - Open browser DevTools (F12)
   - Go to Console tab

2. **Check dataLayer**
   ```javascript
   // View current dataLayer contents
   console.log(window.dataLayer);
   
   // Monitor new pushes
   window.dataLayer.push = new Proxy(window.dataLayer.push, {
     apply: function(target, thisArg, argumentsList) {
       console.log('GTM Push:', argumentsList[0]);
       return target.apply(thisArg, argumentsList);
     }
   });
   ```

3. **Test Auth Events**
   - **Login**: Sign in with email OTP or Google OAuth
   - **Sign Up**: Create a new account
   - **Logout**: Click Sign Out in General Settings
   - Check console for `login`, `sign_up`, or `logout` events

4. **Test Checkout Events**
   - Navigate to `/dashboard/your-credits`
   - Click "Upgrade plan" or "Buy more credits"
   - Check console for `begin_checkout` event
   - Complete checkout flow
   - After redirect, check console for `purchase` event

5. **GTM Preview Mode**
   - Open GTM Preview mode
   - Navigate through the app
   - Verify events appear in GTM Preview with correct payloads

### Event Verification Checklist

- [ ] `login` event fires after email OTP verification
- [ ] `login` event fires after Google OAuth
- [ ] `sign_up` event fires when new user created via OTP
- [ ] `sign_up` event fires when new user created via Google OAuth
- [ ] `logout` event fires when user signs out
- [ ] `begin_checkout` event fires when clicking subscription button
- [ ] `begin_checkout` event fires when clicking topup button
- [ ] `purchase` event fires after successful checkout redirect
- [ ] All events include correct payload structure
- [ ] No events fire during SSR (server-side rendering)

---

## Notes

- All GTM events are client-side only (include `typeof window !== 'undefined'` guards)
- Events follow GA4 recommended event names where applicable
- Purchase events are verified server-side before firing to ensure accuracy
- URL params are used to pass auth/purchase state through redirects
- Components use Suspense boundaries to handle async operations safely

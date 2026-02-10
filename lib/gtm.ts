/**
 * Google Tag Manager (GTM) helper functions
 * 
 * All functions include SSR guards to ensure they only run on the client.
 * Use these helpers to push events and data to window.dataLayer for GTM tracking.
 */

// Type for dataLayer
type DataLayer = Array<Record<string, unknown>>;

/**
 * Low-level function to push any payload to window.dataLayer
 * @param payload - Object to push to dataLayer
 */
export function gtmPush(payload: Record<string, unknown>): void {
  if (typeof window === 'undefined') {
    return;
  }

  // Type assertion for dataLayer (GTM injects this)
  const dataLayer = (window as unknown as { dataLayer?: DataLayer }).dataLayer;
  
  if (!dataLayer) {
    (window as unknown as { dataLayer: DataLayer }).dataLayer = [];
  }

  (window as unknown as { dataLayer: DataLayer }).dataLayer.push(payload);
}

/**
 * Convenience wrapper to push an event to GTM
 * @param eventName - Name of the event (e.g., 'login', 'purchase')
 * @param params - Additional event parameters
 */
export function gtmEvent(eventName: string, params?: Record<string, unknown>): void {
  if (typeof window === 'undefined') {
    return;
  }

  const payload: Record<string, unknown> = {
    event: eventName,
    ...params,
  };

  gtmPush(payload);
}

/**
 * Set or update user information in GTM dataLayer
 * @param userData - User data to set (user_id, user_status)
 */
export function gtmSetUser(userData: { user_id?: string; user_status?: string }): void {
  if (typeof window === 'undefined') {
    return;
  }

  gtmPush({
    user_id: userData.user_id ?? '',
    user_status: userData.user_status ?? 'guest',
  });
}

/**
 * Type definitions for common GTM events
 */
export interface GTMEventParams {
  login?: {
    method: 'google' | 'email';
  };
  sign_up?: {
    method: 'google' | 'email';
  };
  logout?: Record<string, never>;
  begin_checkout?: {
    plan?: string;
    price_id: string;
    mode: 'subscription' | 'payment';
    currency?: string;
    value?: number;
  };
  checkout_session_created?: {
    session_id: string;
    mode: 'subscription' | 'payment';
    price_id: string;
    plan?: string;
  };
  purchase?: {
    transaction_id: string;
    currency: string;
    value: number;
    plan?: string;
    mode: 'subscription' | 'payment';
    items?: Array<{
      item_id?: string;
      item_name?: string;
      price?: number;
      quantity?: number;
    }>;
  };
}

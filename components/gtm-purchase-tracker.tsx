'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { gtmEvent } from '@/lib/gtm';
import { getGaClientId, hashEmailSha256 } from '@/lib/utils';
import { useUser } from '@/lib/contexts/user-context';

/**
 * Client component that detects purchase success from URL params,
 * verifies the session with the server, and fires GTM purchase event
 */
export function GTMPurchaseTracker() {
  const searchParams = useSearchParams();
  const [hasFired, setHasFired] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    // Check for purchase success params
    const purchaseSuccess = searchParams.get('purchase');
    const sessionId = searchParams.get('session_id');
    const mode = searchParams.get('mode') as 'subscription' | 'payment' | null;

    if (purchaseSuccess === 'success' && sessionId && !hasFired) {
      // Verify session and get purchase details from server
      const verifyAndFireEvent = async () => {
        try {
          const response = await fetch(`/api/stripe/verify-session?session_id=${sessionId}`);
          if (!response.ok) {
            return;
          }

          const data = await response.json();
          const topupEmailHash = user?.email ? await hashEmailSha256(user.email) : undefined;
          
          // Fire purchase event
          gtmEvent('purchase', {
            transaction_id: sessionId,
            currency: data.currency || 'usd',
            value: data.amount_total ? data.amount_total / 100 : 0,
            plan: data.plan || undefined,
            mode: mode || (data.mode || 'payment'),
            items: data.items || [],
            user_id: user?.id ?? undefined,
            ga_client_id: getGaClientId() ?? undefined,
            email_sha256: topupEmailHash,
          });

          setHasFired(true);
        } catch (error) {
          // Silently fail - purchase event tracking is non-critical
        }
      };

      verifyAndFireEvent();
    }
  }, [searchParams, hasFired]);

  return null; // This component doesn't render anything
}

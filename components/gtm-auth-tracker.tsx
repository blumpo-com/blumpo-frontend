'use client';

import { useEffect } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import { gtmEvent } from '@/lib/gtm';

/**
 * Client component that detects auth success from URL params and fires GTM events
 * Should be included in pages that handle post-auth redirects
 */
export function GTMAuthTracker() {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    // Check for auth success params
    const authSuccess = searchParams.get('auth');
    const authMethod = searchParams.get('method') as 'google' | 'email' | null;
    const isNewUser = searchParams.get('isNewUser') === 'true';

    if (authSuccess === 'success' && authMethod) {
      // Fire appropriate event based on whether it's a new user
      if (isNewUser) {
        gtmEvent('sign_up', { method: authMethod });
      } else {
        gtmEvent('login', { method: authMethod });
      }

      // Clean up URL params (optional - removes from browser history)
      // Note: We don't modify URL here to avoid navigation loops
      // The params will remain but won't fire events again due to useEffect dependency
    }
  }, [searchParams, pathname]);

  return null; // This component doesn't render anything
}

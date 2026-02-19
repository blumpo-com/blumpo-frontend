'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { gtmEvent } from '@/lib/gtm';
import { useUser } from '@/lib/contexts/user-context';

/**
 * Client component that detects auth success from URL params and fires GTM events
 * Should be included in pages that handle post-auth redirects
 */
export function GTMAuthTracker() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const hasFiredRef = useRef<string | null>(null);
  const { user, isLoading } = useUser();
  const previousUserRef = useRef<string | null>(null);

  useEffect(() => {
    // Wait for user data to load
    if (isLoading) return;

    // Check for auth success params in URL
    const authSuccess = searchParams.get('auth');
    const authMethod = searchParams.get('method') as 'google' | 'email' | null;
    let isNewUser = searchParams.get('isNewUser') === 'true';
    
    // Detect Google OAuth completion by checking:
    // 1. URL params (if present)
    // 2. User just appeared (was null, now exists) + has photoUrl (Google OAuth indicator)
    const currentUserId = user?.id || null;
    const wasLoggedOut = previousUserRef.current === null;
    const justLoggedIn = wasLoggedOut && currentUserId !== null;
    const hasGooglePhoto = user?.photoUrl !== null && user?.photoUrl !== undefined;
    
    // If no URL params but user just logged in with Google photo, it's Google OAuth
    let detectedMethod = authMethod;
    if (!authMethod && justLoggedIn && hasGooglePhoto) {
      detectedMethod = 'google';
    }
    
    // For Google OAuth, detect isNewUser by checking user creation time
    if (detectedMethod === 'google' && !searchParams.has('isNewUser') && user) {
      if (user.createdAt) {
        const createdAt = new Date(user.createdAt);
        const now = new Date();
        const secondsSinceCreation = (now.getTime() - createdAt.getTime()) / 1000;
        isNewUser = secondsSinceCreation < 60; // User created within last minute
      }
    }
    
    // Create a unique key for this auth event to prevent duplicates
    const eventKey = `${authSuccess || 'detected'}-${detectedMethod}-${isNewUser}-${pathname}-${currentUserId}`;
    
    // Fire event if:
    // 1. URL has auth=success params, OR
    // 2. We detected a Google login (just logged in + has photoUrl)
    const shouldFire = (authSuccess === 'success' && detectedMethod) || 
                      (justLoggedIn && detectedMethod === 'google');
    
    if (shouldFire && detectedMethod && hasFiredRef.current !== eventKey) {
      hasFiredRef.current = eventKey;
      
      // Fire appropriate event based on whether it's a new user
      if (isNewUser) {
        gtmEvent('sign_up', { method: detectedMethod });
      } else {
        gtmEvent('login', { method: detectedMethod });
      }
      
      // Clean up URL params if they exist (optional, prevents showing in address bar)
      if (authSuccess === 'success') {
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.delete('auth');
        newParams.delete('method');
        newParams.delete('isNewUser');
        const newUrl = `${pathname}${newParams.toString() ? `?${newParams.toString()}` : ''}`;
        router.replace(newUrl, { scroll: false });
      }
    }
    
    // Update previous user ref
    previousUserRef.current = currentUserId;
  }, [searchParams, pathname, user, isLoading, router]);

  return null; // This component doesn't render anything
}

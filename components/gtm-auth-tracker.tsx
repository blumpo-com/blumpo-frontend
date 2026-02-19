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
  const initialUserRef = useRef<string | null>(null);

  useEffect(() => {
    // Wait for user data to load
    if (isLoading) {
      return;
    }

    // Store initial user ID on first render to detect if user was already logged in
    if (initialUserRef.current === null) {
      initialUserRef.current = user?.id || null;
    }

    // Check for auth success params in URL
    const authSuccess = searchParams.get('auth');
    const authMethod = searchParams.get('method') as 'google' | 'email' | null;
    let isNewUser = searchParams.get('isNewUser') === 'true';
    
    const currentUserId = user?.id || null;
    
    // Detect Google OAuth completion by checking:
    // 1. URL params (if present)
    // 2. User just appeared (was null, now exists) + has photoUrl (Google OAuth indicator)
    const wasLoggedOut = previousUserRef.current === null;
    const justLoggedIn = wasLoggedOut && currentUserId !== null;
    const hasGooglePhoto = user?.photoUrl !== null && user?.photoUrl !== undefined;
    
    // Check if user was already logged in when component first mounted (page refresh scenario)
    const wasAlreadyLoggedIn = initialUserRef.current !== null;
    
    // Check if user has a recent login (within last 5 minutes) - indicates fresh login
    const hasRecentLogin = user?.lastLoginAt ? (() => {
      const lastLogin = new Date(user.lastLoginAt);
      const now = new Date();
      const secondsSinceLogin = (now.getTime() - lastLogin.getTime()) / 1000;
      return secondsSinceLogin < 300; // Within last 5 minutes
    })() : false;
    
    // If no URL params but user just logged in with Google photo, it's Google OAuth
    // Use lastLoginAt timestamp to detect fresh logins instead of wasAlreadyLoggedIn
    // If lastLoginAt is very recent (within 5 min), it's a fresh login, not a refresh
    let detectedMethod = authMethod;
    if (!authMethod && justLoggedIn && hasGooglePhoto) {
      // Fire if: user has very recent login (within 5 minutes) - indicates fresh login
      // This works even if user was already logged in on mount (because session persists)
      if (hasRecentLogin) {
        detectedMethod = 'google';
      } else if (!wasAlreadyLoggedIn) {
        // Fallback: if user wasn't already logged in on mount, also detect
        detectedMethod = 'google';
      }
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
    
    // Check sessionStorage to prevent firing on page refresh
    // Use a more specific key that includes pathname to allow events on different pages
    const sessionKey = `gtm_auth_${currentUserId}_${pathname}`;
    const hasFiredInSession = typeof window !== 'undefined' && currentUserId 
      ? sessionStorage.getItem(sessionKey) === 'true'
      : false;
    
    // Fire event if:
    // 1. URL has auth=success params (always fire if params present, but check sessionStorage to prevent duplicates), OR
    // 2. We detected a Google login (just logged in + has photoUrl + (wasn't already logged in OR has recent login))
    const shouldFire = (authSuccess === 'success' && detectedMethod && !hasFiredInSession) || 
                      (justLoggedIn && detectedMethod === 'google' && !hasFiredInSession);
    
    if (shouldFire && detectedMethod && hasFiredRef.current !== eventKey) {
      hasFiredRef.current = eventKey;
      
      // Store in sessionStorage to prevent firing on refresh
      if (typeof window !== 'undefined' && currentUserId) {
        sessionStorage.setItem(sessionKey, 'true');
      }
      
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

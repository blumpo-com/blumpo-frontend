'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function OAuthRedirectHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if we just came from OAuth (no generate param yet)
    const hasGenerate = searchParams.get('generate');
    
    // Check for redirect cookie set before OAuth
    if (!hasGenerate) {
      const cookies = document.cookie.split(';');
      const oauthRedirectCookie = cookies.find(c => c.trim().startsWith('oauth_redirect='));
      
      if (oauthRedirectCookie) {
        // Parse the cookie value (URLSearchParams format)
        // Cookie format: "oauth_redirect=redirect=generate&website_url=..."
        const cookieValue = oauthRedirectCookie.split('=').slice(1).join('='); // Handle values with = in them
        const params = new URLSearchParams(decodeURIComponent(cookieValue));
        
        const redirect = params.get('redirect');
        const websiteUrl = params.get('website_url');
        
        // Clear the cookie
        document.cookie = 'oauth_redirect=; path=/; max-age=0';
        
        // Redirect with generation params if needed - redirect to root with params
        // The url-input-section component will handle starting the generation
        if (redirect === 'generate' && websiteUrl) {
          router.replace(`/generating?website_url=${encodeURIComponent(websiteUrl)}&login=true`);
        }
      }
    }
  }, [router, searchParams]);

  return null; // This component doesn't render anything
}


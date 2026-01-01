'use client';

import { UrlInput } from '@/components/url-input';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export function UrlInputSection() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [autoGenerateUrl, setAutoGenerateUrl] = useState<string | null>(null);

    // Check for auto-generation params (after login redirect)
    useEffect(() => {
        const websiteUrl = searchParams.get('website_url');
        const shouldGenerate = searchParams.get('generate') === 'true';
        
        if (shouldGenerate && websiteUrl) {
            // Clear the query params but stay on the same page (root /)
            router.replace('/', { scroll: false });
            // Set state to trigger generation
            setAutoGenerateUrl(websiteUrl);
        }
    }, [searchParams, router]);

    const handleSubmit = async (url: string) => {
        if(isLoading) return;
        setIsLoading(true);
        setErrorMsg(null);
    
        try {
          // Check if user is authenticated before proceeding
          const userRes = await fetch('/api/user');
          const userData = await userRes.json();
          
          if (!userData || !userRes.ok) {
            // User not authenticated - redirect to sign-in
            const signInUrl = `/sign-in?redirect=generate&website_url=${encodeURIComponent(url)}`;
            window.location.href = signInUrl;
            return;
          }
          
          // User is authenticated - navigate to generating page
          router.push(`/generating?website_url=${encodeURIComponent(url)}`);
        } catch (e: any) {
          setErrorMsg(e?.message || 'Request failed');
          setIsLoading(false);
        }
      };

    // Auto-trigger generation if we have a pending auto-generate request
    useEffect(() => {
        if (autoGenerateUrl) {
            const url = autoGenerateUrl;
            setAutoGenerateUrl(null); // Clear the state
            // Navigate to generating page - it will handle the API call
            router.push(`/generating?website_url=${encodeURIComponent(url)}`);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoGenerateUrl, router]); // Trigger when autoGenerateUrl is set

    return (
        <section className="flex flex-col gap-4">
             <p className="mt-5 text-base font-bold sm:mt-10 sm:text-xl lg:text-lg xl:text-xl">
                Start for free now and create ads in 30s.
              </p>
            <UrlInput
                onSubmit={handleSubmit}
                isLoading={isLoading}
                placeholder="https://example.com/my-webpage"
            />
            <p className="text-base font-bold
             sm:text-xl lg:text-lg xl:text-xl">
                Yes, it is that simple.
              </p>

            {errorMsg && (
                <div className="flex flex-col gap-4 p-6 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 font-semibold">Error</p>
                    <p className="text-gray-600">{errorMsg}</p>
                </div>
            )}
            
        </section>
       
    );
}

'use client';

import { UrlInput } from '@/components/url-input';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { LoggedInDialog } from '@/components/logged-in-dialog';

export function UrlInputSection() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showLoggedInDialog, setShowLoggedInDialog] = useState(false);

  const handleSubmit = async (url: string) => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorMsg(null);

    try {

      // Check if user is authenticated and has brands with one api call to /api/brands
      // If 401, redirect to sign-in
      // If 200, check if brands exist and navigate to generating page or show logged in dialog
      const brandsRes = await fetch('/api/brands');
      if (brandsRes.ok) {
        const brands = await brandsRes.json();
        if (brands && brands.length > 0) {
          // User has brands - navigate to generating page
          setShowLoggedInDialog(true);
          setIsLoading(false);
          return;
        } else {
          // User has no brands - navigate to generating page
          router.push(`/generating?website_url=${encodeURIComponent(url)}`);
          setIsLoading(false);
          return;
        }
      } else {
        // User not authenticated - redirect to sign-in
        const signInUrl = `/sign-in?redirect=generate&website_url=${encodeURIComponent(url)}&login=true`;
        window.location.href = signInUrl;
        setIsLoading(false);
        return;
      }
    } catch (e: any) {
      setErrorMsg(e?.message || 'Request failed');
      setIsLoading(false);
    }
  };


  return (
    <section className="flex flex-col gap-4">

      <UrlInput
        onSubmit={handleSubmit}
        isLoading={isLoading}
        placeholder="Paste your website URL here (e.g. www.yourcompany.com)"
      />


      {errorMsg && (
        <div className="flex flex-col gap-4 p-6 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 font-semibold">Error</p>
          <p className="text-gray-600">{errorMsg}</p>
        </div>
      )}

      {/* Already Logged In Dialog */}
      <LoggedInDialog
        open={showLoggedInDialog}
        onClose={() => setShowLoggedInDialog(false)}
      />

    </section>

  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UrlInput } from '@/components/url-input';
import { useUser } from '@/lib/contexts/user-context';
import { getBrandLimit } from '@/lib/constants/brand-limits';
import { ErrorDialog } from '@/components/error-dialog';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function InputUrlPage() {
  const router = useRouter();
  const { user, isLoading: isLoadingUser } = useUser();
  const { data: brands = [], isLoading: isLoadingBrands } = useSWR<{ id: string }[]>(
    '/api/brands',
    fetcher,
    { revalidateOnFocus: false }
  );
  const [errorDialog, setErrorDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    errorCode: string | null;
  }>({
    open: false,
    title: 'Brand Limit Reached',
    message: '',
    errorCode: null,
  });

  const planCode = user?.tokenAccount?.planCode ?? 'FREE';
  const brandLimit = getBrandLimit(planCode);
  const isAtLimit = brands.length >= brandLimit;

  // On mount: if user navigated directly and is at brand limit, show upgrade dialog
  useEffect(() => {
    if (isLoadingUser || isLoadingBrands) return;
    if (isAtLimit) {
      setErrorDialog({
        open: true,
        title: 'Brand Limit Reached',
        message: `Your ${planCode} plan allows up to ${brandLimit === Infinity ? 'unlimited' : brandLimit} brand(s). Upgrade your plan to add more brands.`,
        errorCode: 'BRAND_LIMIT_REACHED',
      });
    }
  }, [isAtLimit, isLoadingUser, isLoadingBrands, planCode, brandLimit]);

  const handleSubmit = async (url: string) => {
    if (isAtLimit) {
      setErrorDialog({
        open: true,
        title: 'Brand Limit Reached',
        message: `Your ${planCode} plan allows up to ${brandLimit === Infinity ? 'unlimited' : brandLimit} brand(s). Upgrade your plan to add more brands.`,
        errorCode: 'BRAND_LIMIT_REACHED',
      });
      return;
    }
    router.push(`/generating?website_url=${encodeURIComponent(url.trim())}`);
  };

  return (
    <div className="flex h-full min-h-screen w-full">
      {/* Left: empty container for future animation */}
      <div className="flex-1 min-h-0 flex items-center justify-center p-8">
        <div className="w-full max-w-lg h-[400px] rounded-2xl bg-gray-100" />
      </div>

      {/* Right: content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-lg">
          <h1 className="text-3xl md:text-4xl font-bold text-black tracking-tight mb-4">
            Create AI B2B SaaS{' '}
            <span className="text-brand-secondary">ads</span>{' '}
            that win.
          </h1>
          <p className="text-base text-gray-600 mb-8">
            Enter your website URL and we'll create a complete, consistent brand tailored to your business - from visuals to messaging.
          </p>
          <UrlInput
            onSubmit={handleSubmit}
            placeholder="https://example.com/my-webpage"
          />
        </div>
      </div>

      <ErrorDialog
        open={errorDialog.open}
        onClose={() =>
          setErrorDialog((prev) => ({ ...prev, open: false }))
        }
        title={errorDialog.title}
        message={errorDialog.message}
        errorCode={errorDialog.errorCode}
      />
    </div>
  );
}

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/contexts/user-context';
import { getBrandLimit } from '@/lib/constants/brand-limits';
import { ErrorDialog } from '@/components/error-dialog';
import { UrlInput } from '@/components/url-input';
import { JetpackAdIllustration } from '@/components/jetpack-ad-illustration';
import { GTMAuthTracker } from '@/components/gtm-auth-tracker';
import useSWR from 'swr';
import styles from './page.module.css';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function InputUrlPage() {
  const router = useRouter();
  const { user, isLoading: isLoadingUser } = useUser();
  const { data: brands = [], isLoading: isLoadingBrands } = useSWR<{ id: string }[]>(
    '/api/brands',
    fetcher,
    { revalidateOnFocus: false }
  );
  const [lastSubmittedUrl, setLastSubmittedUrl] = useState('');
  const [isLoadingUrlCheck, setIsLoadingUrlCheck] = useState(false);
  const [errorDialog, setErrorDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    errorCode: string | null;
    brandId?: string;
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

  const handleSubmitUrl = async (urlValue: string) => {
    setIsLoadingUrlCheck(true);
    if (isAtLimit) {
      setErrorDialog({
        open: true,
        title: 'Brand Limit Reached',
        message: `Your ${planCode} plan allows up to ${brandLimit === Infinity ? 'unlimited' : brandLimit} brand(s). Upgrade your plan to add more brands.`,
        errorCode: 'BRAND_LIMIT_REACHED',
      });
      setIsLoadingUrlCheck(false);
      return;
    }
    const trimmedUrl = urlValue.trim();

    try {
      const checkRes = await fetch(`/api/brands/check-url?url=${encodeURIComponent(trimmedUrl)}`);
      if (checkRes.ok) {
        const data = await checkRes.json();
        if (data.exists && data.brand) {
          setLastSubmittedUrl(trimmedUrl);
          setErrorDialog({
            open: true,
            title: 'Brand Already Exists',
            message: `You already have a brand for this website: ${data.brand.name}. Would you like to go to your brand or generate new ads for it?`,
            errorCode: 'EXISTING_BRAND',
            brandId: data.brand.id,
          });
          setIsLoadingUrlCheck(false);
          return;
        }
      }
    } catch {
      // Continue to generation if check fails
    }
    setIsLoadingUrlCheck(false);
    router.push(`/generating?website_url=${encodeURIComponent(trimmedUrl)}`);
  };

  const handleExistingBrandGoToBrand = () => {
    if (errorDialog.brandId) {
      localStorage.setItem('blumpo_current_brand_id', errorDialog.brandId);
      setErrorDialog((prev) => ({ ...prev, open: false }));
      router.push('/dashboard/brand-dna');
    }
  };

  const handleExistingBrandContinue = () => {
    setErrorDialog((prev) => ({ ...prev, open: false }));
    router.push(`/generating?website_url=${encodeURIComponent(lastSubmittedUrl)}`);
  };

  return (
    <div className={styles.page}>
      {/* GTM Auth Tracker - detects auth success and fires events */}
      <Suspense fallback={null}>
        <GTMAuthTracker />
      </Suspense>
      {/* Left: Jetpack ad illustration */}
      <div className={styles.leftPanel}>
        <JetpackAdIllustration />
      </div>

      {/* Right: content */}
      <div className={styles.rightPanel}>
        <div className={styles.contentBlock}>
          <h1 className={styles.headline}>
            Create AI B2B <span className={styles.headlineAccent}>ads that win.</span>
          </h1>
          <p className={styles.description}>
            Enter your website URL and we'll create a complete, consistent brand tailored to your business - from visuals to messaging.
          </p>
          <UrlInput
            onSubmit={handleSubmitUrl}
            isLoading={isLoadingUrlCheck}
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
        primaryButton={
          errorDialog.errorCode === 'EXISTING_BRAND'
            ? {
              label: 'Go to Brand',
              onClick: handleExistingBrandGoToBrand,
              variant: 'cta',
            }
            : errorDialog.errorCode === 'BRAND_LIMIT_REACHED'
              ? {
                label: 'Upgrade Plan',
                onClick: () => router.push('/dashboard/your-credits'),
                variant: 'cta',
              }
              : undefined
        }
        secondaryButton={
          errorDialog.errorCode === 'BRAND_LIMIT_REACHED'
            ? {
              label: 'Go Back',
              onClick: () => { },
              variant: 'outline',
            }
            : undefined
        }
      />
    </div>
  );
}

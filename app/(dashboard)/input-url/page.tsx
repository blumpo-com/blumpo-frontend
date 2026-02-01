'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { useUser } from '@/lib/contexts/user-context';
import { getBrandLimit } from '@/lib/constants/brand-limits';
import { ErrorDialog } from '@/components/error-dialog';
import useSWR from 'swr';
import styles from './page.module.css';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function isValidUrl(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  const pattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(?:[:#/?].*)?$/i;
  const localhost = /^(https?:\/\/)?localhost(?:[:#/?].*)?$/i;
  return pattern.test(v) || localhost.test(v);
}

export default function InputUrlPage() {
  const router = useRouter();
  const { user, isLoading: isLoadingUser } = useUser();
  const { data: brands = [], isLoading: isLoadingBrands } = useSWR<{ id: string }[]>(
    '/api/brands',
    fetcher,
    { revalidateOnFocus: false }
  );
  const [url, setUrl] = useState('');
  const [isInvalid, setIsInvalid] = useState(false);
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

  const handleSubmit = async () => {
    setIsLoadingUrlCheck(true);
    const valid = isValidUrl(url);
    if (!valid) {
      setIsInvalid(true);
      setIsLoadingUrlCheck(false);
      return;
    }
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
    setIsInvalid(false);
    const trimmedUrl = url.trim();

    // Check if user already has a brand with this URL
    try {
      const checkRes = await fetch(`/api/brands/check-url?url=${encodeURIComponent(trimmedUrl)}`);
      if (checkRes.ok) {
        const data = await checkRes.json();
        if (data.exists && data.brand) {
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
    router.push(`/generating?website_url=${encodeURIComponent(url.trim())}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className={styles.page}>
      {/* Left: empty container for future animation */}
      <div className={styles.leftPanel}>
        <div className={styles.animationContainer} />
      </div>

      {/* Right: content */}
      <div className={styles.rightPanel}>
        <div className={styles.contentBlock}>
          <h1 className={styles.headline}>
            Create AI B2B SaaS <span className={styles.headlineAccent}>ads that win.</span>
          </h1>
          <p className={styles.description}>
            Enter your website URL and we'll create a complete, consistent brand tailored to your business - from visuals to messaging.
          </p>
          <div>
            <div className={`${styles.urlInputWrapper} gradient-primary`}>
              <input
                type="text"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setIsInvalid(false);
                }}
                placeholder="https://example.com/my-webpage"
                aria-invalid={isInvalid}
                onKeyDown={handleKeyDown}
                className={styles.urlInput}
              />
              <button
                type="button"
                onClick={handleSubmit}
                className={`${styles.submitButton} ${isLoadingUrlCheck ? styles.disabled : ''}`}
                aria-label="Submit URL"
              >
                <ArrowRight size={20} strokeWidth={2} />
              </button>
            </div>
            {isInvalid && (
              <p className={styles.errorMessage}>
                We'll need a valid URL, like "blumpo.com/home".
              </p>
            )}
          </div>
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
        onPrimaryAction={errorDialog.errorCode === 'EXISTING_BRAND' ? handleExistingBrandGoToBrand : undefined}
        primaryActionLabel={errorDialog.errorCode === 'EXISTING_BRAND' ? 'Go to Brand' : undefined}
        // showSecondaryButton={errorDialog.errorCode === 'EXISTING_BRAND'}
        // secondaryActionLabel={errorDialog.errorCode === 'EXISTING_BRAND' ? 'Generate New Ads Anyway' : undefined}
        // onSecondaryAction={errorDialog.errorCode === 'EXISTING_BRAND' ? handleExistingBrandContinue : undefined}
      />
    </div>
  );
}

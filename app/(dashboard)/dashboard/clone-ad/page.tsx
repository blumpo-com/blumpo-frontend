'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useUser } from '@/lib/contexts/user-context';
import { useBrand } from '@/lib/contexts/brand-context';
import { FormatSelectionContent } from '../customized-ads/format-selection';
import { ErrorDialog } from '@/components/error-dialog';
import styles from '../customized-ads/page.module.css';

const CLONE_AD_CREDITS_SINGLE = 10;
const CLONE_AD_CREDITS_BOTH = 15;

function CloneAdPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workflowId = searchParams.get('workflowId');
  const { user } = useUser();
  const { currentBrand } = useBrand();

  const [selectedFormat, setSelectedFormat] = useState<string>('1:1');
  const [isLoading, setIsLoading] = useState(false);
  const [isLowCreditsDialogOpen, setIsLowCreditsDialogOpen] = useState(false);
  const [requiredCredits, setRequiredCredits] = useState(0);

  const tokenBalance = user?.tokenAccount?.balance ?? 0;
  const formats = selectedFormat === '1:1-9:16' ? ['1:1', '9:16'] : [selectedFormat];
  const creditsRequired = formats.length === 2 ? CLONE_AD_CREDITS_BOTH : CLONE_AD_CREDITS_SINGLE;

  useEffect(() => {
    if (!workflowId) {
      router.replace('/dashboard');
    }
  }, [workflowId, router]);

  const handleGenerate = async () => {
    if (!workflowId) return;
    if (tokenBalance < creditsRequired) {
      setRequiredCredits(creditsRequired);
      setIsLowCreditsDialogOpen(true);
      return;
    }

    setIsLoading(true);
    try {
      const createResponse = await fetch('/api/generation-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'clone_ad',
          workflowId,
          formats,
          brandId: currentBrand?.id ?? null,
        }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create generation job');
      }

      const newJob = await createResponse.json();
      router.push(`/dashboard/ad-generation?job_id=${newJob.id}&clone_ads=true`);
    } catch (error) {
      console.error('Error creating clone-ad job:', error);
      setIsLowCreditsDialogOpen(true);
      setRequiredCredits(creditsRequired);
    } finally {
      setIsLoading(false);
    }
  };

  if (!workflowId) {
    return null;
  }

  return (
    <div className={styles.pageContainer}>
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingContent}>
            <div className={styles.spinner}></div>
            <p className={styles.loadingText}>Processing...</p>
          </div>
        </div>
      )}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Clone template ad</h1>
        <p className={styles.pageDescription}>Select the format for your cloned ad.</p>
      </div>

      <div className={styles.contentArea}>
        <FormatSelectionContent
          selectedFormat={selectedFormat}
          onSelectedFormatChange={setSelectedFormat}
          creditsForSingle={CLONE_AD_CREDITS_SINGLE}
          creditsForBoth={CLONE_AD_CREDITS_BOTH}
        />
      </div>

      <div className={styles.navigationButtons}>
        <button
          className={styles.backButton}
          onClick={() => router.push('/dashboard')}
          type="button"
        >
          <svg
            className={styles.arrowIcon}
            width="16"
            height="16"
            viewBox="0 0 11 11"
            fill="none"
          >
            <path
              d="M6.5 2.5L4 5L6.5 7.5"
              stroke="#040404"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Back</span>
        </button>
        <button
          className={`${styles.nextButton} ${styles.chooseRandom}`}
          onClick={handleGenerate}
          type="button"
          disabled={tokenBalance < creditsRequired}
        >
          <span>Generate</span>
          <Image
            src="/assets/icons/Wand.svg"
            alt="Magic wand"
            className={styles.magicWandIcon}
            width={16}
            height={16}
          />
        </button>
      </div>

      <ErrorDialog
        open={isLowCreditsDialogOpen}
        onClose={() => setIsLowCreditsDialogOpen(false)}
        title="Not enough coins"
        message={`You need at least ${requiredCredits} coins to use this format. Top up your balance to continue.`}
        primaryButton={{
          label: 'Get more coins',
          onClick: () => router.push('/dashboard/your-credits'),
          variant: 'cta',
        }}
        secondaryButton={{
          label: 'Go Back',
          onClick: () => setIsLowCreditsDialogOpen(false),
          variant: 'outline',
        }}
      />
    </div>
  );
}

export default function CloneAdPage() {
  return (
    <Suspense fallback={null}>
      <CloneAdPageContent />
    </Suspense>
  );
}

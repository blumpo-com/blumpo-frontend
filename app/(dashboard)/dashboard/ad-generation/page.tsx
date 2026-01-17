'use client';

import { useState, Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CreatingProcess } from './creating-process';
import { ReadyAdsView } from './ready-ads-view';

// Use NEXT_PUBLIC_ prefix for client-side access
const IS_TEST_MODE = process.env.NEXT_PUBLIC_IS_TEST_MODE === 'true';

function AdGenerationPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const jobId = searchParams.get('job_id');
  const formatParam = searchParams.get('format'); // '1:1' or '16:9' for quick ads
  const isQuickAds = searchParams.get('quick_ads') === 'true';

  const [isProcessComplete, setIsProcessComplete] = useState(IS_TEST_MODE);
  const [jobFormats, setJobFormats] = useState<string[] | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);

  // If no job_id, show error or redirect
  if (!jobId) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <h1>No job ID provided</h1>
        <p>Please provide a valid job_id in the URL</p>
      </div>
    );
  }

  // Check job status and handle quick ads
  useEffect(() => {
    if (!jobId) return;

    const checkJobStatus = async () => {
      try {
        const response = await fetch(`/api/generation-job?jobId=${jobId}`);
        if (response.ok) {
          const job = await response.json();
          const currentStatus = job.status;
          setJobStatus(currentStatus);
          const formats = job.formats || [];
          setJobFormats(formats);

          // For quick ads, if job is already complete, mark ads as displayed
          if (isQuickAds && currentStatus === 'SUCCEEDED' && formatParam) {
            // Format is already in database format (1:1 or 16:9)
            const dbFormat = formatParam;
            try {
              await fetch('/api/quick-ads/mark-displayed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  jobId,
                  format: dbFormat,
                }),
              });
            } catch (error) {
              console.error('Error marking ads as displayed:', error);
            }
          }

          // If job is complete, show ready view
          if (currentStatus === 'SUCCEEDED') {
            setIsProcessComplete(true);
          } else if (currentStatus === 'FAILED' || currentStatus === 'CANCELED') {
            setIsProcessComplete(true); // Show error state
          }
        }
      } catch (error) {
        console.error('Error fetching job:', error);
      }
    };

    // Initial check
    checkJobStatus();

    // Poll job status if not complete (for quick ads generation)
    if (isQuickAds) {
      const interval = setInterval(() => {
        checkJobStatus();
      }, 2000); // Poll every 2 seconds

      return () => clearInterval(interval);
    }
  }, [jobId, isQuickAds, formatParam]);

  const handleProcessComplete = () => {
    setIsProcessComplete(true);
  };

  const handleSeeAds = async () => {
    if (!jobId) return;

    // For quick ads, use the format from URL parameter
    if (isQuickAds && formatParam) {
      router.push(`/dashboard/ad-generation/ad-review-view?job_id=${jobId}&format=${formatParam}`);
      return;
    }

    // For regular ads, determine format from job
    if (!jobFormats) {
      // Fetch if not already fetched
      try {
        const response = await fetch(`/api/generation-job?jobId=${jobId}`);
        if (response.ok) {
          const job = await response.json();
          const formats = job.formats || [];

          // Map database formats to our format type
          // Database uses: '1:1' and '16:9'
          let format: '1:1' | '16:9' | 'mixed' = '1:1';
          const has1x1 = formats.includes('1:1');
          const has16x9 = formats.includes('16:9');

          if (has1x1 && has16x9) {
            format = 'mixed';
          } else if (has16x9) {
            format = '16:9';
          } else if (has1x1) {
            format = '1:1';
          }

          router.push(`/dashboard/ad-generation/ad-review-view?job_id=${jobId}&format=${format}`);
        }
      } catch (error) {
        console.error('Error fetching job:', error);
      }
    } else {
      // Use already fetched formats
      let format: '1:1' | '16:9' | 'mixed' = '1:1';
      const has1x1 = jobFormats.includes('1:1');
      const has16x9 = jobFormats.includes('16:9');

      if (has1x1 && has16x9) {
        format = 'mixed';
      } else if (has16x9) {
        format = '16:9';
      } else if (has1x1) {
        format = '1:1';
      }
      router.push(`/dashboard/ad-generation/ad-review-view?job_id=${jobId}&format=${format}`);
    }
  };

  // Show ready ads view when process is complete
  if (isProcessComplete && jobStatus === 'SUCCEEDED') {
    return <ReadyAdsView onSeeAds={handleSeeAds} jobId={jobId || undefined} />;
  }

  // Show creating process (for both regular and quick ads)
  // For quick ads, we poll job status in useEffect above
  return (
    <CreatingProcess
      onComplete={handleProcessComplete}
    />
  );
}

export default function AdGenerationPage() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh'
      }}>
        <p>Loading...</p>
      </div>
    }>
      <AdGenerationPageContent />
    </Suspense>
  );
}


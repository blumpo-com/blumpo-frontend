'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CreatingProcess } from '../dashboard/ad-generation/creating-process';
import { GeneratedAdsDisplay } from './generated-ads-display';
import { ReadyAdsView } from '../dashboard/ad-generation/ready-ads-view';
import { LoggedInDialog } from '@/components/logged-in-dialog';
import { ErrorDialog } from '@/components/error-dialog';
import { GTMAuthTracker } from '@/components/gtm-auth-tracker';
import { shuffle } from '@/lib/utils';

const STEP_TIMINGS = {
  'analyze-website': 15000,      // 15 seconds
  'capture-tone': 20000,         // 20 seconds
  'review-social': 25000,        // 25 seconds (longer, with progress bar)
  'benchmark-competitors': 30000, // 30 seconds
  'craft-cta': 70000,            // 70 seconds
}; // Total time: 160 seconds

interface AdImage {
  id: string;
  title: string | null;
  publicUrl: string;
  width: number | null;
  height: number | null;
  format: string;
  workflowId: string | null;
  archetype: {
    code: string;
    displayName: string;
    description: string | null;
  } | null;
  createdAt: string;
}

type JobStatus = 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELED';

function hasValidImages(images: unknown): images is AdImage[] {
  return Array.isArray(images) && images.length > 0 && images.some((img) => img && typeof (img as { publicUrl?: unknown }).publicUrl === 'string');
}

interface UserWithTokenAccount {
  id: string;
  email: string;
  displayName: string | null;
  tokenAccount: {
    planCode: string;
    balance: number;
  } | null;
}

function GeneratingPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const websiteUrl = searchParams.get('website_url');
  const jobId = searchParams.get('job_id');
  const login = searchParams.get('login') === 'true'; // get login flag, when null false
  
  // GTM Auth Tracker - detects auth success and fires events
  // This page is outside dashboard layout, so we need to include it here
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [images, setImages] = useState<AdImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [actualJobId, setActualJobId] = useState<string | null>(null);
  const [isPaidUser, setIsPaidUser] = useState(false);
  const [showReadyAds, setShowReadyAds] = useState(false);
  const [showGeneratedAds, setShowGeneratedAds] = useState(false);
  const [showLoggedInDialog, setShowLoggedInDialog] = useState(false);
  const [hasBrands, setHasBrands] = useState<boolean | null>(null);
  const [errorDialog, setErrorDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    errorCode: string | null;
    canRegenerate?: boolean;
    canSeeValidImages?: boolean;
  }>({
    open: false,
    title: 'Error',
    message: '',
    errorCode: null,
  });
  const hasInitiatedRef = useRef<string | null>(null);
  const [animationRestartKey, setAnimationRestartKey] = useState(0);

  // Fetch user subscription status
  useEffect(() => {
    const fetchUserSubscription = async () => {
      try {
        const userRes = await fetch('/api/user');
        if (userRes.ok) {
          const userData: UserWithTokenAccount = await userRes.json();
          if (userData?.tokenAccount?.planCode && userData.tokenAccount.planCode !== 'FREE') {
            setIsPaidUser(true);
          }
        }
      } catch (error) {
        console.error('Error fetching user subscription:', error);
      }
    };

    fetchUserSubscription();
  }, []);

  // Check for login parameter and show dialog if user has brands
  useEffect(() => {
    if (login) {
      const checkBrands = async () => {
        try {
          const brandsRes = await fetch('/api/brands');
          if (brandsRes.ok) {
            const brands = await brandsRes.json();
            if (brands && brands.length > 0) {
              // User has brands - show dialog
              setShowLoggedInDialog(true);
              setHasBrands(true);
            }
            else {
              setHasBrands(false);
            }
          }
        } catch (error) {
          console.error('Error checking brands:', error);
          setHasBrands(false);
        }
      };

      checkBrands();
    }
  }, [login]);

  useEffect(() => {
    if (login && (hasBrands === true || hasBrands === null)) {
      return;
    }
    // Create a unique key for this effect run based on dependencies
    const effectKey = `${websiteUrl || ''}-${jobId || ''}`;

    // Prevent duplicate calls (React Strict Mode runs effects twice in development)
    // Only prevent if we've already initiated for this exact combination
    if (hasInitiatedRef.current === effectKey) {
      return;
    }

    // Mark this combination as initiated
    hasInitiatedRef.current = effectKey;

    // If we have a job_id but no website_url, we're coming back to a completed job
    // Show GeneratedAdsDisplay directly
    const fetchImagesForJob = async () => {
      if (jobId && !websiteUrl && !showReadyAds) {
        setIsLoading(false);
        setStatus('SUCCEEDED');
        setShowGeneratedAds(true);

        try {
          const imagesRes = await fetch(`/api/generate/job-images?jobId=${jobId}`);
          if (imagesRes.ok) {
            const imagesData = await imagesRes.json();
            setImages(shuffle(imagesData)); // Set images in random order
          } else {
            console.log('Failed to get images', imagesRes);
            setError('Failed to get images');
          }
        } catch (err) {
          console.log('Failed to get images', err);
          setError('Failed to get images');
        }
        return;
      }
    };

    if (jobId && !websiteUrl && !showReadyAds) {
      fetchImagesForJob();
      return;
    }

    if (jobId && !websiteUrl) {
      return;
    }

    // If no website URL, redirect home
    if (!websiteUrl) {
      router.replace('/');
      return;
    }

    // Call API - it will wait for callback
    const generateAds = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: websiteUrl }),
        });

        if (!res.ok) {
          let msg = 'Generation request failed';
          let errorCode = null;
          try {
            const j = await res.json();
            if (j?.error) msg = j.error;
            errorCode = j?.error_code;
            // Set actual job id
            setActualJobId(j?.job_id);

            if (errorCode === 'INSUFFICIENT_TOKENS') {
              msg = 'Insufficient tokens. Please upgrade your plan or purchase more tokens.';
              // Show error dialog for insufficient tokens
              setErrorDialog({
                open: true,
                title: 'Insufficient Tokens',
                message: msg,
                errorCode: 'INSUFFICIENT_TOKENS',
              });
              setIsLoading(false);
              return;
            } else if (errorCode === 'AUTH_REQUIRED') {
              // Redirect to sign-in
              const signInUrl = `/sign-in?redirect=generate&website_url=${encodeURIComponent(websiteUrl)}`;
              window.location.href = signInUrl;
              return;
            } else if (errorCode === 'TIMEOUT') {
              msg = 'Generation is taking longer than expected. Please try again later.';
              // Show error dialog for timeout
              setErrorDialog({
                open: true,
                title: 'Generation Timeout',
                message: msg,
                errorCode: 'TIMEOUT',
              });
              setIsLoading(false);
              return;
            } else {
              const hasImages = hasValidImages(j?.images) && !!j?.job_id;
              setErrorDialog({
                open: true,
                title: 'Generation Failed',
                message: msg,
                errorCode: errorCode || 'UNKNOWN',
                canRegenerate: true,
                canSeeValidImages: hasImages,
              });
              if (hasImages && j?.images) setImages(shuffle(j.images));
              setIsLoading(false);
              return;
            }
          } catch {
            // Show error dialog for parse errors
            setErrorDialog({
              open: true,
              title: 'Generation Failed',
              message: msg,
              errorCode: 'UNKNOWN',
              canRegenerate: true,
            });
            setIsLoading(false);
            return;
          }
        }

        const data = await res.json();
        setStatus(data.status);

        if (data.job_id) {
          setActualJobId(data.job_id);
          router.replace(`/generating?job_id=${data.job_id}`);
        }

        if (data.status === 'SUCCEEDED') {
          setImages(shuffle(data.images || []));
          if (!data.images || data.images.length === 0) {
            setError('Generation completed but no images were created.');
          } else {
            setShowReadyAds(true);
          }
        } else if (data.status === 'FAILED' || data.status === 'CANCELED') {
          const errorMessage = data.error_message || `Generation ${data.status.toLowerCase()}`;
          setError(errorMessage);
          const hasValidImages = data.images && data.images.length > 0;
          if (hasValidImages) {
            setImages(shuffle(data.images));
          }

          setErrorDialog({
            open: true,
            title: data.status === 'FAILED' ? 'Generation Failed' : 'Generation Canceled',
            message: errorMessage,
            errorCode: data.error_code || null,
            canRegenerate: true,
            canSeeValidImages: hasValidImages,
          });
        }
      } catch (e: any) {
        console.error('Error generating ads:', e);
        const errorMessage = e?.message || 'Failed to generate ads';
        setError(errorMessage);
        // Show error dialog for catch block errors
        setErrorDialog({
          open: true,
          title: 'Generation Failed',
          message: errorMessage,
          errorCode: null,
          canRegenerate: !!websiteUrl,
        });
      } finally {
        setIsLoading(false);
      }
    };

    generateAds();
  }, [websiteUrl, jobId, router, hasBrands]);

  // Handle "See ads" button click
  const handleSeeAds = () => {
    setShowReadyAds(false);
    setShowGeneratedAds(true);
  };

  // See valid images: charge tokens for partial result, then navigate to job view
  const handleSeeValidImages = async () => {
    if (!actualJobId) return;
    try {
      const res = await fetch('/api/generate/charge-partial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: actualJobId }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.error || 'Failed to charge for images';
        setErrorDialog({
          open: true,
          title: 'Error',
          message: data?.error_code === 'INSUFFICIENT_TOKENS'
            ? 'Insufficient tokens to view images. Please upgrade your plan.'
            : msg,
          errorCode: data?.error_code || null,
        });
        return;
      }
      setError(null);
      setErrorDialog({ open: false, title: '', message: '', errorCode: null });
      setStatus('SUCCEEDED');
      setShowGeneratedAds(true);
      router.replace(`/generating?job_id=${actualJobId}`);
    } catch (e: any) {
      setErrorDialog({
        open: true,
        title: 'Error',
        message: e?.message || 'Failed to load images',
        errorCode: null,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Regenerate: delete failed/canceled job, then create new generation
  const handleRegenerate = async () => {
    if (!actualJobId || !websiteUrl) return;
    try {
      await fetch(`/api/generation-job?jobId=${actualJobId}`, { method: 'DELETE' });
      setError(null);
      setErrorDialog({ open: false, title: '', message: '', errorCode: null });
      setStatus(null);
      setActualJobId(null);
      hasInitiatedRef.current = null;
      setAnimationRestartKey((k) => k + 1);
      setIsLoading(true);
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: websiteUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.error || 'Generation request failed';
        setError(msg);
        const hasImages = hasValidImages(data?.images) && !!data?.job_id;
        setActualJobId(data?.job_id ?? null);
        setErrorDialog({
          open: true,
          title: 'Generation Failed',
          message: msg,
          errorCode: data?.error_code || null,
          canRegenerate: !['INSUFFICIENT_TOKENS', 'AUTH_REQUIRED'].includes(data?.error_code || ''),
          canSeeValidImages: hasImages,
        });
        if (hasImages && data?.images) setImages(shuffle(data.images));
        return;
      }
      setError(null);
      setStatus(data.status);
      if (data.job_id) {
        setActualJobId(data.job_id);
        router.replace(`/generating?job_id=${data.job_id}`);
      }
      if (data.status === 'SUCCEEDED') {
        setImages(shuffle(data.images || []));
        setShowReadyAds((data.images?.length ?? 0) > 0);
        if (!data.images?.length) setError('Generation completed but no images were created.');
      } else if (data.status === 'FAILED' || data.status === 'CANCELED') {
        setError(data.error_message || `Generation ${data.status.toLowerCase()}`);
        const hasValidImages = (data.images?.length ?? 0) > 0;
        if (hasValidImages) setImages(shuffle(data.images));
        setErrorDialog({
          open: true,
          title: data.status === 'FAILED' ? 'Generation Failed' : 'Generation Canceled',
          message: data.error_message || `Generation ${data.status.toLowerCase()}`,
          errorCode: data.error_code || null,
          canRegenerate: true,
          canSeeValidImages: hasValidImages,
        });
      }
    } catch (e: any) {
      setError(e?.message || 'Regeneration failed');
      setErrorDialog({
        open: true,
        title: 'Generation Failed',
        message: e?.message || 'Regeneration failed',
        errorCode: null,
        canRegenerate: !!websiteUrl,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading/creating process while API call is in progress
  if (isLoading || status === null || status === 'RUNNING' || status === 'QUEUED') {
    return (
      <>
        <Suspense fallback={null}>
          <GTMAuthTracker />
        </Suspense>
        <CreatingProcess stepTimings={STEP_TIMINGS} restartTrigger={animationRestartKey} />
        <LoggedInDialog
          open={showLoggedInDialog}
          onClose={() => {
            setShowLoggedInDialog(false);
            router.push('/');
          }}
        />
        <ErrorDialog
          open={errorDialog.open}
          onClose={() => setErrorDialog({ ...errorDialog, open: false })}
          title={errorDialog.title}
          message={errorDialog.message}
          errorCode={errorDialog.errorCode}
          tertiaryButton={errorDialog.canSeeValidImages && actualJobId ? {
            label: 'See valid images',
            onClick: handleSeeValidImages,
            variant: 'cta',
          } : undefined}
          primaryButton={errorDialog.canRegenerate && websiteUrl ? {
            label: 'Regenerate',
            onClick: handleRegenerate,
            variant: 'outline',
          } : undefined}
          secondaryButton={{
            label: 'Go Back',
            onClick: () => router.push('/'),
            variant: 'outline',
          }}
        />
      </>
    );
  }

  // Show error if generation failed
  if (status === 'FAILED' || status === 'CANCELED' || error) {
    const errorMessage = error || 'Generation failed. Please try again.';
    return (
      <>
        <Suspense fallback={null}>
          <GTMAuthTracker />
        </Suspense>
        <div className="flex flex-col items-center justify-center min-h-screen p-6">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              {status === 'CANCELED' ? 'Generation Canceled' : 'Generation Failed'}
            </h2>
            <p className="text-gray-600 mb-4">{errorMessage}</p>
            {images.length > 0 && (
              <p className="text-sm text-gray-500 mb-4">
                {images.length} image(s) were created before the failure.
              </p>
            )}
            <div className="flex flex-col gap-2">
              {images.length > 0 && actualJobId && (
                <button
                  onClick={handleSeeValidImages}
                  className="w-full bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600"
                >
                  See valid images
                </button>
              )}
              {websiteUrl && (
                <button
                  onClick={handleRegenerate}
                  className="w-full bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600"
                >
                  Regenerate
                </button>
              )}
              <button
                onClick={() => router.push('/')}
                className="w-full border border-gray-300 py-2 px-4 rounded-lg hover:bg-gray-50"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
        <LoggedInDialog
          open={showLoggedInDialog}
          onClose={() => {
            setShowLoggedInDialog(false);
            router.push('/');
          }}
        />
        <ErrorDialog
          open={errorDialog.open}
          onClose={() => setErrorDialog({ ...errorDialog, open: false })}
          title={errorDialog.title}
          message={errorDialog.message}
          errorCode={errorDialog.errorCode}
          tertiaryButton={errorDialog.canSeeValidImages && actualJobId ? {
            label: 'See valid images',
            onClick: handleSeeValidImages,
            variant: 'cta',
          } : undefined}
          primaryButton={errorDialog.canRegenerate && websiteUrl ? {
            label: 'Regenerate',
            onClick: handleRegenerate,
            variant: 'outline',
          } : undefined}
          secondaryButton={{
            label: 'Go Back',
            onClick: () => router.push('/'),
            variant: 'outline',
          }}
        />
      </>
    );
  }

  // Show ReadyAdsView when generation succeeds (first time)
  if (status === 'SUCCEEDED' && showReadyAds && !showGeneratedAds) {
    return (
      <>
        <Suspense fallback={null}>
          <GTMAuthTracker />
        </Suspense>
        <ReadyAdsView onSeeAds={handleSeeAds} jobId={actualJobId || jobId || undefined} />
        <LoggedInDialog
          open={showLoggedInDialog}
          onClose={() => {
            setShowLoggedInDialog(false);
            router.push('/');
          }}
        />
        <ErrorDialog
          open={errorDialog.open}
          onClose={() => setErrorDialog({ ...errorDialog, open: false })}
          title={errorDialog.title}
          message={errorDialog.message}
          errorCode={errorDialog.errorCode}
        />
      </>
    );
  }

  // Show generated ads when user clicks "See ads" or when coming back with job_id
  if (status === 'SUCCEEDED' && images.length > 0 && showGeneratedAds) {
    return (
      <>
        <Suspense fallback={null}>
          <GTMAuthTracker />
        </Suspense>
        <GeneratedAdsDisplay images={images} jobId={actualJobId || jobId || ''} isPaidUser={isPaidUser} />
        <LoggedInDialog
          open={showLoggedInDialog}
          onClose={() => {
            setShowLoggedInDialog(false);
            router.push('/');
          }}
        />
        <ErrorDialog
          open={errorDialog.open}
          onClose={() => setErrorDialog({ ...errorDialog, open: false })}
          title={errorDialog.title}
          message={errorDialog.message}
          errorCode={errorDialog.errorCode}
        />
      </>
    );
  }

  // Default: still loading
  return (
    <>
      <Suspense fallback={null}>
        <GTMAuthTracker />
      </Suspense>
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="spinner"></div>
      </div>
      <LoggedInDialog
        open={showLoggedInDialog}
        onClose={() => {
          setShowLoggedInDialog(false);
          router.push('/');
        }}
      />
      <ErrorDialog
        open={errorDialog.open}
        onClose={() => setErrorDialog({ ...errorDialog, open: false })}
        title={errorDialog.title}
        message={errorDialog.message}
        errorCode={errorDialog.errorCode}
      />
    </>
  );
}

export default function GeneratingPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="spinner"></div>
      </div>
    }>
      <GeneratingPageContent />
    </Suspense>
  );
}


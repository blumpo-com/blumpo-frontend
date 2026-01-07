'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CreatingProcess } from '../dashboard/ad-generation/creating-process';
import { GeneratedAdsDisplay } from './generated-ads-display';
import { ReadyAdsView } from '../dashboard/ad-generation/ready-ads-view';
import { LoggedInDialog } from '@/components/logged-in-dialog';
import { shuffle } from '@/lib/utils';

const STEP_TIMINGS = {
  'analyze-website': 10000,      // 10 seconds
  'capture-tone': 15000,         // 15 seconds
  'review-social': 20000,        // 20 seconds (longer, with progress bar)
  'benchmark-competitors': 30000, // 30 seconds
  'craft-cta': 70000,            // 70 seconds
}; // Total time: 140 seconds

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
  const hasInitiatedRef = useRef<string | null>(null);

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

    if(jobId && !websiteUrl){
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

            if (errorCode === 'INSUFFICIENT_TOKENS') {
              msg = 'Insufficient tokens. Please upgrade your plan or purchase more tokens.';
            } else if (errorCode === 'AUTH_REQUIRED') {
              // Redirect to sign-in
              const signInUrl = `/sign-in?redirect=generate&website_url=${encodeURIComponent(websiteUrl)}`;
              window.location.href = signInUrl;
              return;
            } else if (errorCode === 'TIMEOUT') {
              msg = 'Generation is taking longer than expected. Please try again later.';
            }
          } catch { }
          throw new Error(msg);
        }

        const data = await res.json();
        setStatus(data.status);

        // Store job_id from response
        if (data.job_id) {
          setActualJobId(data.job_id);
          // Change search params to include the job_id
          router.replace(`/generating?job_id=${data.job_id}`);
        }

        if (data.status === 'SUCCEEDED') {
          setImages(shuffle(data.images || []));
          if (!data.images || data.images.length === 0) {
            setError('Generation completed but no images were created.');
          } else {
            // Show ReadyAdsView when generation succeeds
            setShowReadyAds(true);
          }
        } else if (data.status === 'FAILED' || data.status === 'CANCELED') {
          setError(data.error_message || `Generation ${data.status.toLowerCase()}`);
          if (data.images && data.images.length > 0) {
            setImages(shuffle(data.images));
          }
        }
      } catch (e: any) {
        console.error('Error generating ads:', e);
        setError(e?.message || 'Failed to generate ads');
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

  // Show loading/creating process while API call is in progress
  if (isLoading || status === null || status === 'RUNNING' || status === 'QUEUED') {
    return (
      <>
        <CreatingProcess stepTimings={STEP_TIMINGS} />
        <LoggedInDialog 
          open={showLoggedInDialog} 
          onClose={() => {
            setShowLoggedInDialog(false);
            router.push('/');
          }} 
        />
      </>
    );
  }

  // Show error if generation failed
  if (status === 'FAILED' || status === 'CANCELED' || error) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-screen p-6">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Generation Failed</h2>
            <p className="text-gray-600 mb-4">{error || 'Generation failed. Please try again.'}</p>
            {images.length > 0 && (
              <p className="text-sm text-gray-500 mb-4">
                {images.length} image(s) were created before the failure.
              </p>
            )}
            <button
              onClick={() => router.push('/')}
              className="w-full bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600"
            >
              Go Back
            </button>
          </div>
        </div>
        <LoggedInDialog 
          open={showLoggedInDialog} 
          onClose={() => {
            setShowLoggedInDialog(false);
            router.push('/');
          }} 
        />
      </>
    );
  }

  // Show ReadyAdsView when generation succeeds (first time)
  if (status === 'SUCCEEDED' && showReadyAds && !showGeneratedAds) {
    return (
      <>
        <ReadyAdsView onSeeAds={handleSeeAds} jobId={actualJobId || jobId || undefined} />
        <LoggedInDialog 
          open={showLoggedInDialog} 
          onClose={() => {
            setShowLoggedInDialog(false);
            router.push('/');
          }} 
        />
      </>
    );
  }

  // Show generated ads when user clicks "See ads" or when coming back with job_id
  if (status === 'SUCCEEDED' && images.length > 0 && showGeneratedAds) {
    return (
      <>
        <GeneratedAdsDisplay images={images} jobId={actualJobId || jobId || ''} isPaidUser={isPaidUser} />
        <LoggedInDialog 
          open={showLoggedInDialog} 
          onClose={() => {
            setShowLoggedInDialog(false);
            router.push('/');
          }} 
        />
      </>
    );
  }

  // Default: still loading
  return (
    <>
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


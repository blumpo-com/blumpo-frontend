'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CreatingProcess } from '../dashboard/customized-ads/creating-process';
import { GeneratedAdsDisplay } from './generated-ads-display';

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

export default function GeneratingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const websiteUrl = searchParams.get('website_url');
  const jobId = searchParams.get('job_id');
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [images, setImages] = useState<AdImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // If we have a job_id, we're already done - this shouldn't happen with callback-based flow
    // But handle it for backwards compatibility
    if (jobId && !websiteUrl) {
      router.replace('/');
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
          } catch {}
          throw new Error(msg);
        }

        const data = await res.json();
        setStatus(data.status);
        
        if (data.status === 'SUCCEEDED') {
          setImages(data.images || []);
          if (!data.images || data.images.length === 0) {
            setError('Generation completed but no images were created.');
          }
        } else if (data.status === 'FAILED' || data.status === 'CANCELED') {
          setError(data.error_message || `Generation ${data.status.toLowerCase()}`);
          if (data.images && data.images.length > 0) {
            setImages(data.images);
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
  }, [websiteUrl, jobId, router]);

  // Show loading/creating process while API call is in progress
  if (isLoading || status === null || status === 'RUNNING' || status === 'QUEUED') {
    return <CreatingProcess />;
  }

  // Show error if generation failed
  if (status === 'FAILED' || status === 'CANCELED' || error) {
    return (
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
    );
  }

  // Show generated ads
  if (status === 'SUCCEEDED' && images.length > 0) {
    return <GeneratedAdsDisplay images={images} jobId={jobId!} />;
  }

  // Default: still loading
  return <CreatingProcess />;
}


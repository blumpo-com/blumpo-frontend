'use client';

import { useState, Suspense, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CreatingProcess } from './creating-process';
import { ReadyAdsView } from './ready-ads-view';

// Use NEXT_PUBLIC_ prefix for client-side access
const IS_TEST_MODE = process.env.NEXT_PUBLIC_IS_TEST_MODE === 'true';

function AdGenerationPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const jobId = searchParams.get('job_id');
  const formatParam = searchParams.get('format');
  const isQuickAds = searchParams.get('quick_ads') === 'true';
  
  const [isProcessComplete, setIsProcessComplete] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [jobFormats, setJobFormats] = useState<string[] | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  
  // Ref to prevent double execution (React Strict Mode)
  const hasInitiatedRef = useRef<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [hasMarkedAsDisplayed, setHasMarkedAsDisplayed] = useState(false);

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

  // Check job status and trigger generation if needed
  // Separate logic for quick ads vs customized ads
  useEffect(() => {
    // Don't run if there's an error, already generating, or already complete
    if (!jobId || isGenerating || isProcessComplete || generationError) return;
    
    // Don't run if we've already initiated for this jobId
    if (hasInitiatedRef.current === jobId) return;

    // Mark as initiated for this jobId to prevent double execution
    hasInitiatedRef.current = jobId;

    const checkJobAndGenerate = async () => {
      try {
        // Fetch job to check status
        const jobResponse = await fetch(`/api/generation-job?jobId=${jobId}`);
        if (!jobResponse.ok) {
          throw new Error('Failed to fetch job');
        }

        const job = await jobResponse.json();
        const formats = job.formats || [];
        setJobFormats(formats);

        // QUICK ADS FLOW: Only apply when quick_ads=true is in URL
        if (isQuickAds) {
          const generateEndpoint = '/api/generate/quick-ads';

          // If job is QUEUED, trigger generation (API will wait for callback)
          if (job.status === 'QUEUED') {
            setIsGenerating(true);
            setGenerationError(null);

            // Call API - it will wait for callback
            const generateResponse = await fetch(generateEndpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ jobId }),
            });

            if (!generateResponse.ok) {
              let msg = 'Generation request failed';
              let errorCode = null;
              try {
                const errorData = await generateResponse.json();
                if (errorData?.error) msg = errorData.error;
                errorCode = errorData?.error_code;

                if (errorCode === 'INSUFFICIENT_TOKENS') {
                  msg = 'Insufficient tokens. Please upgrade your plan or purchase more tokens.';
                } else if (errorCode === 'TIMEOUT') {
                  msg = 'Generation is taking longer than expected. Please try again later.';
                }
              } catch {
                // Error parsing failed, use default message
              }
              
              setGenerationError(msg);
              setIsGenerating(false);
              return;
            }

            const result = await generateResponse.json();
            
            // Check if generation succeeded
            if (result.status === 'SUCCEEDED') {
              setIsProcessComplete(true);
              setIsGenerating(false);
              setJobStatus('SUCCEEDED');
            } else if (result.status === 'FAILED' || result.status === 'CANCELED') {
              // Generation failed or was canceled
              const errorMessage = result.error_message || `Generation ${result.status.toLowerCase()}`;
              setGenerationError(errorMessage);
              setIsGenerating(false);
            } else {
              // Unexpected status
              setGenerationError(`Unexpected status: ${result.status}`);
              setIsGenerating(false);
            }
          } else if (job.status === 'SUCCEEDED' || job.status === 'COMPLETED') {
            // Job already completed
            setIsProcessComplete(true);
            setJobStatus('SUCCEEDED');
          } else if (job.status === 'FAILED' || job.status === 'CANCELED') {
            // Job failed
            setGenerationError(job.errorMessage || `Job ${job.status}`);
          } else if (job.status === 'RUNNING') {
            // Job is currently running - trigger generation again
            setIsGenerating(true);
            setGenerationError(null);
            
            const generateResponse = await fetch(generateEndpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ jobId }),
            });

            if (!generateResponse.ok) {
              const errorData = await generateResponse.json().catch(() => ({}));
              setGenerationError(errorData.error || 'Failed to continue generation');
              setIsGenerating(false);
              return;
            }

            const result = await generateResponse.json();
            if (result.status === 'SUCCEEDED') {
              setIsProcessComplete(true);
              setIsGenerating(false);
              setJobStatus('SUCCEEDED');
            } else {
              setGenerationError(result.error_message || `Generation ${result.status}`);
              setIsGenerating(false);
            }
          }
        } else {
          // CUSTOMIZED ADS FLOW: Original logic (unchanged)
          const generateEndpoint = '/api/generate/customized-ads';

          // If job is QUEUED, trigger generation (API will wait for callback)
          if (job.status === 'QUEUED') {
            setIsGenerating(true);
            setGenerationError(null);

            // Call API - it will wait for callback
            const generateResponse = await fetch(generateEndpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ jobId }),
            });

            if (!generateResponse.ok) {
              let msg = 'Generation request failed';
              let errorCode = null;
              try {
                const errorData = await generateResponse.json();
                if (errorData?.error) msg = errorData.error;
                errorCode = errorData?.error_code;

                if (errorCode === 'INSUFFICIENT_TOKENS') {
                  msg = 'Insufficient tokens. Please upgrade your plan or purchase more tokens.';
                } else if (errorCode === 'TIMEOUT') {
                  msg = 'Generation is taking longer than expected. Please try again later.';
                }
              } catch {
                // Error parsing failed, use default message
              }
              
              setGenerationError(msg);
              setIsGenerating(false);
              return;
            }

            const result = await generateResponse.json();
            
            // Check if generation succeeded
            if (result.status === 'SUCCEEDED') {
              setIsProcessComplete(true);
              setIsGenerating(false);
            } else if (result.status === 'FAILED' || result.status === 'CANCELED') {
              // Generation failed or was canceled
              const errorMessage = result.error_message || `Generation ${result.status.toLowerCase()}`;
              setGenerationError(errorMessage);
              setIsGenerating(false);
            } else {
              // Unexpected status
              setGenerationError(`Unexpected status: ${result.status}`);
              setIsGenerating(false);
            }
          } else if (job.status === 'SUCCEEDED' || job.status === 'COMPLETED') {
            // Job already completed
            setIsProcessComplete(true);
          } else if (job.status === 'FAILED' || job.status === 'CANCELED') {
            // Job failed
            setGenerationError(job.errorMessage || `Job ${job.status}`);
          } else if (job.status === 'RUNNING') {
            // Job is currently running - this shouldn't happen but handle gracefully
            // Could be from a previous session, trigger generation again
            setIsGenerating(true);
            setGenerationError(null);
            
            // Trigger generation again (API will handle it)
            const generateResponse = await fetch(generateEndpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ jobId }),
            });

            if (!generateResponse.ok) {
              const errorData = await generateResponse.json().catch(() => ({}));
              setGenerationError(errorData.error || 'Failed to continue generation');
              setIsGenerating(false);
              return;
            }

            const result = await generateResponse.json();
            if (result.status === 'SUCCEEDED') {
              setIsProcessComplete(true);
              setIsGenerating(false);
            } else {
              setGenerationError(result.error_message || `Generation ${result.status}`);
              setIsGenerating(false);
            }
          }
        }
      } catch (error) {
        console.error('Error checking job status:', error);
        setGenerationError(error instanceof Error ? error.message : 'Unknown error');
        setIsGenerating(false);
      }
    };

    checkJobAndGenerate();
  }, [jobId, isGenerating, isProcessComplete, generationError, isQuickAds]);

  // Check job status and handle quick ads
  useEffect(() => {
    if (isProcessComplete && jobId && !jobFormats) {
      const fetchJobFormats = async () => {
        try {
          const response = await fetch(`/api/generation-job?jobId=${jobId}`);
          if (response.ok) {
            const job = await response.json();
            const formats = job.formats || [];
            setJobFormats(formats);
          }
        } catch (error) {
          console.error('Error fetching job formats:', error);
        }
      };
      fetchJobFormats();
    }
  }, [isProcessComplete, jobId, jobFormats]);

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
          // Database uses: 'square' (1:1), 'story' (9:16)
          let format: '1:1' | '9:16' | 'mixed' = '1:1';
          const hasSquare = formats.includes('square') || formats.includes('1:1');
          const hasStory = formats.includes('story') || formats.includes('9:16');
          
          if (hasSquare && hasStory) {
            format = 'mixed';
          } else if (hasStory) {
            format = '9:16';
          } else if (hasSquare) {
            format = '1:1';
          }
          
          router.push(`/dashboard/ad-generation/ad-review-view?job_id=${jobId}&format=${format}`);
        }
      } catch (error) {
        console.error('Error fetching job:', error);
      }
    } else {
      // Use already fetched formats
      let format: '1:1' | '9:16' | 'mixed' = '1:1';
      const hasSquare = jobFormats.includes('square') || jobFormats.includes('1:1');
      const hasStory = jobFormats.includes('story') || jobFormats.includes('9:16');
      
      if (hasSquare && hasStory) {
        format = 'mixed';
      } else if (hasStory) {
        format = '9:16';
      } else if (hasSquare) {
        format = '1:1';
      }
      router.push(`/dashboard/ad-generation/ad-review-view?job_id=${jobId}&format=${format}`);
    }
  };

  // Show error if generation failed
  if (generationError && !isGenerating) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <h1>Generation Failed</h1>
        <p>{generationError}</p>
        <button onClick={() => router.push('/dashboard')}>
          Go to Dashboard
        </button>
      </div>
    );
  }

  // Show ready ads view when process is complete
  // For quick ads, check jobStatus; for customized ads, just check isProcessComplete
  if (isProcessComplete && (isQuickAds ? jobStatus === 'SUCCEEDED' : true)) {
    return <ReadyAdsView onSeeAds={handleSeeAds} jobId={jobId || undefined} />;
  }

  // Show creating process (while generating or waiting)
  return (
    <CreatingProcess 
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


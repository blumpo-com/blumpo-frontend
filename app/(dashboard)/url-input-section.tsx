'use client';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { UrlInput } from '@/components/url-input';
import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

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

interface JobStatus {
  id: string;
  status: 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELED';
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

const POLL_INTERVAL = 2000; // Poll every 2 seconds
const MAX_POLL_TIME = 7 * 60 * 1000; // 5 minutes in milliseconds

export function UrlInputSection() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [images, setImages] = useState<AdImage[]>([]);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [jobId, setJobId] = useState<string | null>(null);
    const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const pollStartTimeRef = useRef<number | null>(null);
    const [autoGenerateUrl, setAutoGenerateUrl] = useState<string | null>(null);

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, []);

    // Check for auto-generation params (after login redirect)
    useEffect(() => {
        const websiteUrl = searchParams.get('website_url');
        const shouldGenerate = searchParams.get('generate') === 'true';
        
        if (shouldGenerate && websiteUrl) {
            // Clear the query params but stay on the same page (root /)
            router.replace('/', { scroll: false });
            // Set state to trigger generation
            setAutoGenerateUrl(websiteUrl);
        }
    }, [searchParams, router]);

    const pollJobStatus = async (jobId: string) => {
        try {
            const res = await fetch(`/api/jobs/${jobId}`);
            
            if (!res.ok) {
                throw new Error('Failed to fetch job status');
            }

            const data = await res.json();
            setJobStatus(data.job);

            // If job is completed (SUCCEEDED or FAILED), stop polling
            if (data.job.status === 'SUCCEEDED' || data.job.status === 'FAILED' || data.job.status === 'CANCELED') {
                if (pollIntervalRef.current) {
                    clearInterval(pollIntervalRef.current);
                    pollIntervalRef.current = null;
                }
                setIsLoading(false);

                if (data.job.status === 'SUCCEEDED') {
                    setImages(data.images || []);
                    if (data.images.length === 0) {
                        setErrorMsg('Generation completed but no images were created.');
                    }
                } else {
                    setErrorMsg(data.job.errorMessage || `Generation ${data.job.status.toLowerCase()}`);
                }
                return;
            }

            // Check if we've exceeded max poll time
            if (pollStartTimeRef.current && Date.now() - pollStartTimeRef.current > MAX_POLL_TIME) {
                if (pollIntervalRef.current) {
                    clearInterval(pollIntervalRef.current);
                    pollIntervalRef.current = null;
                }
                setIsLoading(false);
                setErrorMsg('Generation is taking longer than expected. Please check back later.');
            }
        } catch (e: any) {
            console.error('Polling error:', e);
            // Don't stop polling on network errors, just log them
        }
    };

    const handleSubmit = async (url: string) => {
        setIsOpen(true);
        setIsLoading(true);
        setErrorMsg(null);
        setImages([]);
        setJobId(null);
        setJobStatus(null);
    
        // Clear any existing polling
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
    
        try {
          const res = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
          });
    
          if (!res.ok) {
                let msg = 'Generation request failed';
                let errorCode = null;
                let websiteUrl = null;
            try {
              const j = await res.json();
              if (j?.error) msg = j.error;
                    errorCode = j?.error_code;
                    websiteUrl = j?.website_url;
                    
                    if (errorCode === 'INSUFFICIENT_TOKENS') {
                        msg = 'Insufficient tokens. Please upgrade your plan or purchase more tokens.';
                    } else if (errorCode === 'AUTH_REQUIRED') {
                        // Redirect to sign-in with website_url for auto-generation after login
                        const signInUrl = `/sign-in?redirect=generate&website_url=${encodeURIComponent(websiteUrl || url)}`;
                        window.location.href = signInUrl;
                        return; // Don't throw error, just redirect
                    }
            } catch {}
            throw new Error(msg);
          }
    
            const data = await res.json();
            
            if (!data.job_id) {
                throw new Error('No job ID returned');
            }

            setJobId(data.job_id);
            setJobStatus({
                id: data.job_id,
                status: 'QUEUED',
                errorCode: null,
                errorMessage: null,
                createdAt: new Date().toISOString(),
                startedAt: null,
                completedAt: null,
            });

            // Start polling for job status
            pollStartTimeRef.current = Date.now();
            pollIntervalRef.current = setInterval(() => {
                if (data.job_id) {
                    pollJobStatus(data.job_id);
                }
            }, POLL_INTERVAL);

            // Poll immediately
            pollJobStatus(data.job_id);
        } catch (e: any) {
          setErrorMsg(e?.message || 'Request failed');
          setIsLoading(false);
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
            }
        }
      };

    // Auto-trigger generation if we have a pending auto-generate request
    useEffect(() => {
        if (autoGenerateUrl) {
            const url = autoGenerateUrl;
            setAutoGenerateUrl(null); // Clear the state
            handleSubmit(url);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoGenerateUrl]); // Trigger when autoGenerateUrl is set

    return (
        <section className="flex flex-col gap-4">
             <p className="mt-5 text-base font-bold sm:mt-10 sm:text-xl lg:text-lg xl:text-xl">
                Start for free now and create ads in 30s.
              </p>
            <UrlInput
                onSubmit={handleSubmit}
                isLoading={isLoading}
                placeholder="https://example.com/my-webpage"
            />
            <p className="text-base font-bold
             sm:text-xl lg:text-lg xl:text-xl">
                Yes, it is that simple.
              </p>

            <Dialog open={isOpen} onClose={() => {
                setIsOpen(false);
                // Cleanup polling when dialog closes
                if (pollIntervalRef.current) {
                    clearInterval(pollIntervalRef.current);
                    pollIntervalRef.current = null;
                }
            }}>
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center gap-4 p-6">
                    <div className="w-8 h-8 border-4 border-gray-300 border-t-orange-500 rounded-full animate-spin" />
                        <p className="text-gray-600">
                            {jobStatus?.status === 'QUEUED' && 'Queuing your generation...'}
                            {jobStatus?.status === 'RUNNING' && 'Generating your ads...'}
                            {!jobStatus && 'Starting generation...'}
                        </p>
                        {jobId && (
                            <p className="text-sm text-gray-400">Job ID: {jobId.slice(0, 8)}...</p>
                        )}
                    </div>
                ) : errorMsg ? (
                    <div className="flex flex-col gap-4 p-6">
                        <p className="text-red-600 font-semibold">Error</p>
                        <p className="text-gray-600">{errorMsg}</p>
                        {jobStatus?.errorCode && (
                            <p className="text-sm text-gray-400">Error code: {jobStatus.errorCode}</p>
                        )}
                        <Button
                            onClick={() => setIsOpen(false)}
                            className="bg-orange-500 text-white"
                        >
                            Close
                        </Button>
                    </div>
                ) : images.length > 0 ? (
                    <div className="flex flex-col gap-4 p-6 max-h-[80vh] overflow-y-auto">
                        <h3 className="text-lg font-semibold">Generated Ads ({images.length})</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {images.map((image) => (
                                <div key={image.id} className="flex flex-col gap-2">
                                    <img 
                                        src={image.publicUrl} 
                                        alt={image.title || 'Generated ad'} 
                                        className="rounded-xl w-full h-auto object-contain border border-gray-200"
                                    />
                                    {image.title && (
                                        <p className="text-sm text-gray-600">{image.title}</p>
                                    )}
                                    {image.archetype && (
                                        <div className="flex flex-wrap gap-1">
                                            <span 
                                                className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                                            >
                                                {image.archetype.displayName}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                </div>
                    <Button
                    onClick={() => setIsOpen(false)}
                            className="bg-orange-500 text-white mt-4"
                    >
                    Close
                    </Button>
                </div>
                ) : (
                    <div className="flex flex-col gap-4 p-6">
                        <p className="text-gray-600">No images generated</p>
                        <Button
                            onClick={() => setIsOpen(false)}
                            className="bg-orange-500 text-white"
                        >
                            Close
                        </Button>
                    </div>
                )}
            </Dialog>
            
        </section>
       
    );
}

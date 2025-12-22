'use client';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { UrlInput } from '@/components/url-input';
import { useState, useEffect } from 'react';
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

// Removed JobStatus interface and polling constants - no longer needed

export function UrlInputSection() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [images, setImages] = useState<AdImage[]>([]);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [autoGenerateUrl, setAutoGenerateUrl] = useState<string | null>(null);

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

    const handleSubmit = async (url: string) => {
        if(isLoading) return;
        setIsOpen(true);
        setIsLoading(true);
        setErrorMsg(null);
        setImages([]);
    
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
                    } else if (errorCode === 'TIMEOUT') {
                        msg = 'Generation is taking longer than expected. Please try again later.';
                    }
            } catch {}
            throw new Error(msg);
          }
    
            const data = await res.json();
            
            // API now returns images directly when job completes
            if (data.status === 'SUCCEEDED') {
                setImages(data.images || []);
                if (!data.images || data.images.length === 0) {
                    setErrorMsg('Generation completed but no images were created.');
                }
            } else if (data.status === 'FAILED' || data.status === 'CANCELED') {
                setErrorMsg(data.error_message || `Generation ${data.status.toLowerCase()}`);
                // Still show any images that were created before failure
                if (data.images && data.images.length > 0) {
                    setImages(data.images);
                }
            } else {
                throw new Error('Unexpected response status');
            }
            
            setIsLoading(false);
        } catch (e: any) {
          setErrorMsg(e?.message || 'Request failed');
          setIsLoading(false);
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

            <Dialog open={isOpen} onClose={() => setIsOpen(false)}>
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center gap-4 p-6">
                    <div className="w-8 h-8 border-4 border-gray-300 border-t-orange-500 rounded-full animate-spin" />
                        <p className="text-gray-600">
                            Generating your ads... This may take up to 7 minutes.
                        </p>
                    </div>
                ) : errorMsg ? (
                    <div className="flex flex-col gap-4 p-6">
                        <p className="text-red-600 font-semibold">Error</p>
                        <p className="text-gray-600">{errorMsg}</p>
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

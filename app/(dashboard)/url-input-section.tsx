'use client';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { UrlInput } from '@/components/url-input';
import { useState } from 'react';


export function UrlInputSection() {
    const [isOpen, setIsOpen] = useState(false);     // modal is open
    const [isLoading, setIsLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);


    const handleSubmit = async (url: string) => {
        setIsOpen(true);
        setIsLoading(true);
        setErrorMsg(null);
        setImageUrl(null);
    
        try {
          const res = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
          });
    
          if (!res.ok) {
            // JSON Error
            let msg = 'Agent error';
            try {
              const j = await res.json();
              if (j?.error) msg = j.error;
            } catch {}
            throw new Error(msg);
          }
    
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            // { imageBase64: '....' }
            const data = await res.json();
            let src = data?.imageBase64 as string | undefined;
            if (src && !src.startsWith('data:')) {
              // if no `data:image` prefix
              src = `data:image/png;base64,${src}`;
            }
            if (!src) throw new Error('No image in response');
            setImageUrl(src);
          } else {
            throw new Error('Unsupported response type');
          }
        } catch (e: any) {
          setErrorMsg(e?.message || 'Request failed');
        } finally {
          setIsLoading(false);
        }
      };

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
                <div className="flex flex-col items-center justify-center gap-4">
                    <div className="w-8 h-8 border-4 border-gray-300 border-t-orange-500 rounded-full animate-spin" />
                    <p className="text-gray-600">Generating your image…</p>
                </div>
                ) : imageUrl ? (
                <div>
                    <img src={imageUrl} alt="Generated ad" className="rounded-xl w-full" />
                    <Button
                    onClick={() => setIsOpen(false)}
                    className="mt-4 bg-orange-500 text-white"
                    >
                    Close
                    </Button>
                </div>
                ) : (
                <p className="text-gray-600">No image generated</p>
                )}
            </Dialog>
            
        </section>
       
    );
}

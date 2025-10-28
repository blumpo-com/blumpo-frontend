'use client';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ArrowRight } from 'lucide-react';
import { useMemo, useState } from 'react';


export function UrlInputSection() {
    const [url, setUrl] = useState('');
    const [isInvalid, setIsInvalid] = useState(false);

    const [hasError, setHasError] = useState(false);

    const [isOpen, setIsOpen] = useState(false);     // modal is open
    const [isLoading, setIsLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const isValidUrl = (value: string) => {
        const v = value.trim();
        if (!v) return false;
        const pattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(?:[:#/?].*)?$/i;
        const localhost = /^(https?:\/\/)?localhost(?:[:#/?].*)?$/i;
        return pattern.test(v) || localhost.test(v);
    };


    const handleSubmit = async () => {
        const valid = isValidUrl(url);
        setHasError(!valid);
        if (!valid) {
            setIsInvalid(true);
            return;
        }
        
        setIsInvalid(false);
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
             <p className="mt-5 text-base text-gray-500 sm:mt-10 sm:text-xl lg:text-lg xl:text-xl">
                Start for free now! Drop your URL here.
              </p>
            <div>
                <Input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="example.com/my-webpage"
                    aria-invalid={isInvalid}
                    className="py-6"
                />
                {isInvalid && (
                    <p className="mt-2 text-sm text-red-600">
                        We'll need a valid URL, like "blumpo.com/home".
                    </p>
                )}
            </div>
            <p className="text-base text-gray-500 
             sm:text-xl lg:text-lg xl:text-xl">
                Yes, It is that simple.
              </p>

            <div className=" sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0">
                <Button
                    size="lg"
                    variant="default"
                    className="text-lg rounded-full bg-orange-500 text-white cursor-pointer"
                    disabled={isLoading}
                    onClick={handleSubmit}
                >
                    Generate your ads
                    <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
            </div>

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

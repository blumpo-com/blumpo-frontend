'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight } from 'lucide-react';
import { useMemo, useState } from 'react';

export function UrlInputSection() {
    const [url, setUrl] = useState('');

    const [isValid, setIsValid] = useState(false);

    const isValidUrl = (value: string) => {
        const v = value.trim();
        if (!v) return false;
        const pattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(?:[:#/?].*)?$/i;
        const localhost = /^(https?:\/\/)?localhost(?:[:#/?].*)?$/i;
        return pattern.test(v) || localhost.test(v);
    };


    const handleSubmit = () => {
        setIsValid(() => !isValidUrl(url));
    }

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
                    aria-invalid={isValid}
                />
                {isValid && (
                    <p className="mt-2 text-sm text-red-600">
                        We'll need a valid URL, like "super-long-link.com/shorten-it".
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
                    onClick={() => handleSubmit()}
                >
                   Generate your ads
                    <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                
                
              </div>
        </section>
       
    );
}

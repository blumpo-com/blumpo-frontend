'use client';

import { Input } from '@/components/ui/input';
import { ArrowRight } from 'lucide-react';
import { useState } from 'react';

interface UrlInputProps {
  onSubmit: (url: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export function UrlInput({ onSubmit, isLoading = false, placeholder = 'example.com/my-webpage' }: UrlInputProps) {
  const [url, setUrl] = useState('');
  const [isInvalid, setIsInvalid] = useState(false);

  const isValidUrl = (value: string) => {
    const v = value.trim();
    if (!v) return false;
    const pattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(?:[:#/?].*)?$/i;
    const localhost = /^(https?:\/\/)?localhost(?:[:#/?].*)?$/i;
    return pattern.test(v) || localhost.test(v);
  };

  const handleSubmit = () => {
    const valid = isValidUrl(url);
    if (!valid) {
      setIsInvalid(true);
      return;
    }
    
    setIsInvalid(false);
    onSubmit(url);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div>
      <div className="relative gradient-primary rounded-xl shadow-md p-1 flex items-center">
        <Input
          type="text"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setIsInvalid(false);
          }}
          placeholder={placeholder}
          aria-invalid={isInvalid}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent border-0 text-white placeholder:text-white/70 py-6 px-6 rounded-full focus-visible:ring-0 focus-visible:outline-none"
        />
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="cursor-pointer flex-shrink-0 w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mr-4"
        >
          <ArrowRight className="h-5 w-5 text-[#0D3B66]" />
        </button>
      </div>
      {isInvalid && (
        <p className="mt-2 text-sm text-red-600">
          We'll need a valid URL, like "blumpo.com/home".
        </p>
      )}
    </div>
  );
}


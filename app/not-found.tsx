import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-gray-50 px-4">
      <div className="max-w-lg w-full space-y-8 text-center">
        {/* Illustration with 404 */}
        <div className="relative flex justify-center items-center mb-8">
          
          
          {/* Blumpo character */}
          <div className="relative z-10">
            <Image
              src="/images/blumpo/blumpo-404.png"
              alt="Blumpo confused"
              width={400}
              height={400}
              className="w-auto h-auto max-w-[300px] md:max-w-[400px]"
              priority
            />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
          Oops! Page not found
        </h1>

        {/* Description */}
        <p className="text-base md:text-lg text-gray-900">
          We couldn't find the page that you were looking for.
        </p>
        
         {/* CTA Button */}
        <Button asChild variant="cta" className="px-10 py-6 text-base">
          <Link href="/dashboard">
            Go home
          </Link>
        </Button>
      </div>
    </div>
  );
}

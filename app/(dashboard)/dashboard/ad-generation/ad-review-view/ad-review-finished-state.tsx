'use client';

import Link from 'next/link';

export function AdReviewFinishedState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[100vh] w-full bg-[#F9FAFB] text-center px-4">
      <h2 className="text-3xl font-bold bg-gradient-to-r from-brand-secondary via-brand-tertiary to-brand-primary bg-clip-text text-transparent tracking-tight md:text-4xl mb-3">
        No more ads to review.
      </h2>
      <p className="text-muted-foreground text-lg md:text-xl mb-10">
        All ads have been reviewed.
      </p>
      <Link
        href="/dashboard/content-library"
        className="gradient-primary text-white font-bold px-8 py-4 rounded-full shadow-md hover:opacity-95 transition-opacity"
      >
        Go to content library
      </Link>
    </div>
  );
}

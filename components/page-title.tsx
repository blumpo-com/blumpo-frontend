'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const DEFAULT_TITLE = 'Blumpo - AI-powered ad generator';

const PATH_TITLES: Record<string, string> = {
  '/': DEFAULT_TITLE,
  '/blog': 'Blog',
  '/sign-in': 'Sign In',
  '/sign-up': 'Sign Up',
  '/input-url': 'Input URL',
  '/generating': 'Generating',
  '/dashboard': 'Dashboard',
  '/dashboard/activity': 'Activity',
  '/dashboard/ad-generation/ad-review-view': 'Review Ads',
  '/dashboard/ad-generation': 'Ad Generation',
  '/dashboard/brand-dna': 'Brand DNA',
  '/dashboard/content-library': 'Content Library',
  '/dashboard/customized-ads': 'Customized Ads',
  '/dashboard/general': 'General Settings',
  '/dashboard/security': 'Security',
  '/dashboard/support': 'Support',
  '/dashboard/your-credits': 'Your Credits',
};

function getTitle(pathname: string): string {
  const exact = PATH_TITLES[pathname];
  if (exact) return exact;

  const sortedPaths = Object.keys(PATH_TITLES)
    .filter((p) => p !== '/')
    .sort((a, b) => b.length - a.length);

  for (const path of sortedPaths) {
    if (pathname.startsWith(path)) return PATH_TITLES[path];
  }

  const lastSegment = pathname.split('/').filter(Boolean).pop();
  if (lastSegment) {
    const title = lastSegment
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return `${title} | Blumpo`;
  }

  return 'Blumpo';
}

export function PageTitle() {
  const pathname = usePathname();

  useEffect(() => {
    const path = pathname ?? '/';
    if (path.startsWith('/blog/') && path !== '/blog') return;
    const title = getTitle(path);
    document.title = title === DEFAULT_TITLE ? title : `${title} | Blumpo`;
  }, [pathname]);

  return null;
}

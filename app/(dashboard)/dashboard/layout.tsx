'use client';

import { Suspense } from 'react';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { BrandProvider } from '@/lib/contexts/brand-context';
import { UserProvider } from '@/lib/contexts/user-context';
import { GTMAuthTracker } from '@/components/gtm-auth-tracker';
import { UnsupportedScreenPage } from './unsupported-screen-page';
import { useMediaQuery } from '@/lib/hooks/use-media-query';

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const isSmallScreen = useMediaQuery('(max-width: 1023px)');

  if (isSmallScreen) {
    return (
      <UserProvider>
        <BrandProvider>
          <Suspense fallback={null}>
            <GTMAuthTracker />
          </Suspense>
          <UnsupportedScreenPage />
        </BrandProvider>
      </UserProvider>
    );
  }

  return (
    <UserProvider>
      <BrandProvider>
        <Suspense fallback={null}>
          <GTMAuthTracker />
        </Suspense>
        <div className="flex h-screen bg-[#F9FAFB] overflow-hidden">
          {/* Sidebar */}
          <DashboardSidebar />

          {/* Main content - overflow-y-auto for scroll when cards stack vertically */}
          <main className="flex-1 ml-[267px] min-h-0 overflow-y-auto overflow-x-hidden">
            {children}
          </main>
        </div>
      </BrandProvider>
    </UserProvider>
  );
}

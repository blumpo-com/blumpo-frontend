'use client';

import { Suspense } from 'react';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { BrandProvider } from '@/lib/contexts/brand-context';
import { UserProvider } from '@/lib/contexts/user-context';
import { GTMAuthTracker } from '@/components/gtm-auth-tracker';

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <BrandProvider>
        <Suspense fallback={null}>
          <GTMAuthTracker />
        </Suspense>
        <div className="flex h-screen bg-[#F9FAFB] overflow-hidden">
          {/* Sidebar */}
          <DashboardSidebar />

          {/* Main content */}
          <main className="flex-1 ml-[267px] overflow-hidden">
            {children}
          </main>
        </div>
      </BrandProvider>
    </UserProvider>
  );
}

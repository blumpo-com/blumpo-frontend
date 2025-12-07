'use client';

import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { BrandProvider } from '@/lib/contexts/brand-context';

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <BrandProvider>
      <div className="flex h-screen bg-[#F9FAFB] overflow-hidden">
        {/* Sidebar */}
        <DashboardSidebar />

        {/* Main content */}
        <main className="flex-1 ml-[267px] overflow-hidden">
          {children}
        </main>
      </div>
    </BrandProvider>
  );
}

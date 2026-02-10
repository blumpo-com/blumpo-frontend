'use client';

import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { BrandProvider } from '@/lib/contexts/brand-context';
import { UserProvider } from '@/lib/contexts/user-context';

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <BrandProvider>
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

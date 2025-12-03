'use client';

import { DashboardSidebar } from '@/components/dashboard-sidebar';

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#F9FAFB]">
      {/* Sidebar */}
      <DashboardSidebar />

      {/* Main content */}
      <main className="flex-1 ml-[267px] overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

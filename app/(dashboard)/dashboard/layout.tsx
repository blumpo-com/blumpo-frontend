'use client';

import { DashboardSidebar } from '@/components/dashboard-sidebar';

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[#F9FAFB] overflow-hidden">
        {/* Sidebar */}
      <DashboardSidebar />

        {/* Main content */}
      <main className="flex-1 ml-[267px] overflow-hidden">
        {children}
      </main>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { AdminNav } from './AdminNav';
import { useUser } from '@/lib/contexts/user-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Client-side check (server-side is handled by middleware)
    if (user && user.role !== 'ADMIN') {
      router.push('/dashboard?error=unauthorized');
    }
  }, [user, router]);

  return (
    <div className="flex h-screen bg-[#F9FAFB] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <Link href="/admin" className="flex items-center gap-2">
            <img
              src="/assets/logo/Blumpo_Logo.svg"
              alt="Blumpo Admin"
              className="h-8"
            />
            <span className="text-sm font-semibold text-gray-500">Admin</span>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          <AdminNav />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <Link
            href="/dashboard"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}

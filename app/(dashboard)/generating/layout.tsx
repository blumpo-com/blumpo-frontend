'use client';

import { UserProvider } from '@/lib/contexts/user-context';

export default function GeneratingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <UserProvider>{children}</UserProvider>;
}

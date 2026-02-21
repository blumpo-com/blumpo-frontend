import { AdminLayout } from '@/components/admin/AdminLayout';
import { UserProvider } from '@/lib/contexts/user-context';
import { requireAdmin } from '@/lib/auth/admin';

export default async function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side admin check
  await requireAdmin();

  return (
    <UserProvider>
      <AdminLayout>{children}</AdminLayout>
    </UserProvider>
  );
}

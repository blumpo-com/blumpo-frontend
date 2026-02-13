import { getAdminUser } from '@/lib/auth/admin';
import { getUserWithDetails } from '@/lib/db/queries/admin';
import { redirect } from 'next/navigation';
import { AdminCard } from '@/components/admin/AdminCard';
import Link from 'next/link';

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const admin = await getAdminUser();
  if (!admin) {
    redirect('/dashboard?error=unauthorized');
  }

  const { userId } = await params;
  const user = await getUserWithDetails(userId);

  if (!user) {
    return <div className="p-8">User not found</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/admin/users" className="text-blue-600 hover:text-blue-800">
          ← Back to Users
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">User Details</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AdminCard title="User Information">
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Display Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{user.displayName || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Role</dt>
              <dd className="mt-1 text-sm text-gray-900">{user.role}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1">
                <span className={`px-2 py-1 rounded text-xs ${user.banFlag ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                  {user.banFlag ? 'Banned' : 'Active'}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created At</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(user.createdAt).toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Last Login</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}
              </dd>
            </div>
          </dl>
        </AdminCard>

        <AdminCard title="Token Account">
          {user.tokenAccount ? (
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Balance</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {user.tokenAccount.balance.toLocaleString()} tokens
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Plan</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.tokenAccount.planCode}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Subscription Status</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {user.tokenAccount.subscriptionStatus || 'N/A'}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-gray-500">No token account found</p>
          )}
        </AdminCard>

        <AdminCard title="Statistics">
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Brands</dt>
              <dd className="mt-1 text-sm text-gray-900">{user.brandsCount}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Generation Jobs</dt>
              <dd className="mt-1 text-sm text-gray-900">{user.jobsCount}</dd>
            </div>
          </dl>
        </AdminCard>
      </div>
    </div>
  );
}

import { getAdminUser } from '@/lib/auth/admin';
import { redirect } from 'next/navigation';
import { getAdminStats } from '@/lib/db/queries/admin';
import { AdminCard } from '@/components/admin/AdminCard';
import Link from 'next/link';

export default async function AdminDashboardPage() {
  const admin = await getAdminUser();
  
  if (!admin) {
    redirect('/dashboard?error=unauthorized');
  }

  const stats = await getAdminStats();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <AdminCard>
          <Link href="/admin/users" className="block">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Users</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
          </Link>
        </AdminCard>
        
        <AdminCard>
          <Link href="/admin/brands" className="block">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Brands</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.totalBrands.toLocaleString()}</p>
          </Link>
        </AdminCard>
        
        <AdminCard>
          <Link href="/admin/jobs" className="block">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Generation Jobs</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.totalJobs.toLocaleString()}</p>
            <div className="mt-2 text-xs text-gray-500">
              Active: {stats.activeJobs} | Failed: {stats.failedJobs}
            </div>
          </Link>
        </AdminCard>
        
        <AdminCard>
          <Link href="/admin/workflow-errors" className="block">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Workflow Errors</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.totalErrors.toLocaleString()}</p>
            <div className="mt-2 text-xs text-red-600">
              Unresolved: {stats.unresolvedErrors}
            </div>
          </Link>
        </AdminCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AdminCard>
          <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
          <div className="space-y-2">
            <Link href="/admin/users" className="block text-blue-600 hover:text-blue-800">
              → Users Management
            </Link>
            <Link href="/admin/brands" className="block text-blue-600 hover:text-blue-800">
              → Brands Management
            </Link>
            <Link href="/admin/jobs" className="block text-blue-600 hover:text-blue-800">
              → Generation Jobs
            </Link>
            <Link href="/admin/analytics" className="block text-blue-600 hover:text-blue-800">
              → Analytics Dashboard
            </Link>
            <Link href="/admin/workflow-errors" className="block text-blue-600 hover:text-blue-800">
              → Workflow Errors
            </Link>
            <Link href="/admin/subscriptions" className="block text-blue-600 hover:text-blue-800">
              → Subscription Plans
            </Link>
          </div>
        </AdminCard>

        <AdminCard>
          <h3 className="text-lg font-semibold mb-4">System Statistics</h3>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Total Tokens Used</dt>
              <dd className="text-sm font-semibold">{stats.totalTokensUsed.toLocaleString()}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Success Rate</dt>
              <dd className="text-sm font-semibold">
                {stats.totalJobs > 0
                  ? (((stats.totalJobs - stats.failedJobs) / stats.totalJobs) * 100).toFixed(1)
                  : 0}%
              </dd>
            </div>
          </dl>
        </AdminCard>
      </div>
    </div>
  );
}

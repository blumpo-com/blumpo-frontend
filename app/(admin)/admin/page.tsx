import { getAdminUser } from '@/lib/auth/admin';
import { redirect } from 'next/navigation';
import { getAdminStats } from '@/lib/db/queries/admin';
import { AdminCard } from '@/components/admin/AdminCard';
import { ChartsSection } from '@/components/admin/charts/ChartsSection';
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

      <ChartsSection />

      <div className="mt-6">
        <AdminCard>
          <h3 className="text-lg font-semibold mb-4">System Statistics</h3>
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <dt className="text-sm text-gray-500">Total Tokens Used</dt>
              <dd className="text-sm font-semibold mt-1">{stats.totalTokensUsed.toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Success Rate</dt>
              <dd className="text-sm font-semibold mt-1">
                {stats.totalJobs > 0
                  ? (((stats.totalJobs - stats.failedJobs) / stats.totalJobs) * 100).toFixed(1)
                  : 0}%
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Active Subscriptions</dt>
              <dd className="text-sm font-semibold mt-1">{stats.activeSubscriptions?.toLocaleString() || 0}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Avg Jobs/User</dt>
              <dd className="text-sm font-semibold mt-1">{stats.avgJobsPerUser?.toFixed(1) || 0}</dd>
            </div>
            {stats.mostPopularArchetype && (
              <div>
                <dt className="text-sm text-gray-500">Popular Archetype</dt>
                <dd className="text-sm font-semibold mt-1">{stats.mostPopularArchetype}</dd>
              </div>
            )}
          </dl>
        </AdminCard>
      </div>
    </div>
  );
}

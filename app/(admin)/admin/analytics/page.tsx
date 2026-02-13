'use client';

import { AdminCard } from '@/components/admin/AdminCard';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AnalyticsPage() {
  const { data, error, isLoading } = useSWR('/api/admin/analytics', fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 30000, // Refresh every 30 seconds
  });

  if (error) {
    return <div className="p-8">Error loading analytics</div>;
  }

  const stats = data?.stats;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Analytics Dashboard</h1>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AdminCard>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Users</h3>
              <p className="text-3xl font-bold text-gray-900">{stats?.totalUsers?.toLocaleString() || 0}</p>
            </div>
          </AdminCard>

          <AdminCard>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Brands</h3>
              <p className="text-3xl font-bold text-gray-900">{stats?.totalBrands?.toLocaleString() || 0}</p>
            </div>
          </AdminCard>

          <AdminCard>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Jobs</h3>
              <p className="text-3xl font-bold text-gray-900">{stats?.totalJobs?.toLocaleString() || 0}</p>
              <div className="mt-2 text-xs text-gray-500">
                Active: {stats?.activeJobs || 0} | Failed: {stats?.failedJobs || 0}
              </div>
            </div>
          </AdminCard>

          <AdminCard>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Tokens Used</h3>
              <p className="text-3xl font-bold text-gray-900">{stats?.totalTokensUsed?.toLocaleString() || 0}</p>
            </div>
          </AdminCard>

          <AdminCard>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Workflow Errors</h3>
              <p className="text-3xl font-bold text-gray-900">{stats?.totalErrors?.toLocaleString() || 0}</p>
              <div className="mt-2 text-xs text-red-600">
                Unresolved: {stats?.unresolvedErrors || 0}
              </div>
            </div>
          </AdminCard>
        </div>
      )}
    </div>
  );
}

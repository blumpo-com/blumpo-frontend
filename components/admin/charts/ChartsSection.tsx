'use client';

import useSWR from 'swr';
import { UserGrowthChart } from './UserGrowthChart';
import { TokenUsageChart } from './TokenUsageChart';
import { JobStatusChart } from './JobStatusChart';
import { JobsOverTimeChart } from './JobsOverTimeChart';
import { SubscriptionDistributionChart } from './SubscriptionDistributionChart';
import { RecentActivityFeed } from './RecentActivityFeed';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function ChartsSection() {
  const { data, error, isLoading } = useSWR('/api/admin/analytics/charts?days=30', fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 60000, // Refresh every minute
  });

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        Error loading chart data. Please try again later.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Row 1: User Growth + Token Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UserGrowthChart data={data?.userGrowth || []} isLoading={isLoading} />
        <TokenUsageChart data={data?.tokenUsage || []} isLoading={isLoading} />
      </div>

      {/* Row 2: Job Status + Jobs Over Time */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <JobStatusChart data={data?.jobStatus || []} isLoading={isLoading} />
        <JobsOverTimeChart data={data?.jobsOverTime || []} isLoading={isLoading} />
      </div>

      {/* Row 3: Subscription Distribution + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SubscriptionDistributionChart
            data={data?.subscriptionDistribution || []}
            isLoading={isLoading}
          />
        </div>
        <RecentActivityFeed data={data?.recentActivity || []} isLoading={isLoading} />
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { AdminCard } from '@/components/admin/AdminCard';
import { ArchetypeJobChart } from '@/components/admin/charts/ArchetypeJobChart';
import { ArchetypeImageChart } from '@/components/admin/charts/ArchetypeImageChart';
import { WorkflowImageChart } from '@/components/admin/charts/WorkflowImageChart';
import { ArchetypeActionChart } from '@/components/admin/charts/ArchetypeActionChart';
import { WorkflowActionChart } from '@/components/admin/charts/WorkflowActionChart';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AdsAnalyticsPage() {
  const [imageView, setImageView] = useState<'archetype' | 'workflow'>('archetype');

  const { data, error, isLoading } = useSWR('/api/admin/analytics/ads', fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 60000, // Refresh every minute
  });

  if (error) {
    return (
      <div className="p-8">
        <div className="text-center py-8 text-red-600">
          Error loading ads analytics. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/admin/analytics" className="text-blue-600 hover:text-blue-800">
          ← Back to Analytics
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">Ads Analytics</h1>

      {isLoading ? (
        <div className="text-center py-8">Loading analytics data...</div>
      ) : (
        <div className="space-y-6">
          {/* Section 1: Generation Jobs by Archetype */}
          <ArchetypeJobChart data={data?.archetypeJobs || []} isLoading={isLoading} />

          {/* Section 2: Images Created - Toggleable View */}
          <AdminCard>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Images Created</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setImageView('archetype')}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    imageView === 'archetype'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  View by Archetype
                </button>
                <button
                  onClick={() => setImageView('workflow')}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    imageView === 'workflow'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  View by Workflow
                </button>
              </div>
            </div>
            {imageView === 'archetype' ? (
              <ArchetypeImageChart data={data?.archetypeImages || []} isLoading={isLoading} />
            ) : (
              <WorkflowImageChart data={data?.workflowImages || []} isLoading={isLoading} />
            )}
          </AdminCard>

          {/* Section 3: Ad Actions by Archetype */}
          <ArchetypeActionChart data={data?.archetypeActions || []} isLoading={isLoading} />

          {/* Section 4: Ad Actions by Workflow */}
          <WorkflowActionChart data={data?.workflowActions || []} isLoading={isLoading} />
        </div>
      )}
    </div>
  );
}

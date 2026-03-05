'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import useSWR from 'swr';
import { AdminCard } from '@/components/admin/AdminCard';
import { AdminDateFilter } from '@/components/admin/AdminDateFilter';
import { ArchetypeJobChart } from '@/components/admin/charts/ArchetypeJobChart';
import { ArchetypeImageChart } from '@/components/admin/charts/ArchetypeImageChart';
import { WorkflowImageChart } from '@/components/admin/charts/WorkflowImageChart';
import { ArchetypeActionChart } from '@/components/admin/charts/ArchetypeActionChart';
import { WorkflowActionChart } from '@/components/admin/charts/WorkflowActionChart';
import { UserEngagementChart } from '@/components/admin/charts/UserEngagementChart';
import { ActionConversionChart } from '@/components/admin/charts/ActionConversionChart';
import { RecentActivityTimeline } from '@/components/admin/charts/RecentActivityTimeline';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debouncedValue;
}

export default function AdsAnalyticsPage() {
  const [imageView, setImageView] = useState<'archetype' | 'workflow'>('archetype');
  const [brandSearch, setBrandSearch] = useState('');
  const [brandDropdownOpen, setBrandDropdownOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dateFrom = searchParams.get('dateFrom') ?? '';
  const dateTo = searchParams.get('dateTo') ?? '';
  const userId = searchParams.get('userId') ?? '';
  const brandId = searchParams.get('brandId') ?? '';

  const debouncedBrandSearch = useDebounce(brandSearch, 300);

  const queryParts = [
    dateFrom && `dateFrom=${encodeURIComponent(dateFrom)}`,
    dateTo && `dateTo=${encodeURIComponent(dateTo)}`,
    userId && `userId=${encodeURIComponent(userId)}`,
    brandId && `brandId=${encodeURIComponent(brandId)}`,
  ].filter(Boolean);
  const query = queryParts.join('&');
  const url = query ? `/api/admin/analytics/ads?${query}` : '/api/admin/analytics/ads';

  const { data, error, isLoading } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 60000,
  });

  const { data: usersData } = useSWR<{ users: Array<{ id: string; email: string; displayName: string | null }> }>(
    '/api/admin/users?limit=200',
    fetcher
  );
  const users = usersData?.users ?? [];

  const brandsUrl =
    debouncedBrandSearch
      ? `/api/admin/brands?search=${encodeURIComponent(debouncedBrandSearch)}&limit=50`
      : brandId
        ? `/api/admin/brands?search=${encodeURIComponent(brandId)}&limit=10`
        : '/api/admin/brands?limit=100';
  const { data: brandsData } = useSWR<{ brands: Array<{ id: string; name: string; websiteUrl: string | null; userEmail: string | null }> }>(
    brandDropdownOpen || brandId ? brandsUrl : null,
    fetcher
  );
  const brands = brandsData?.brands ?? [];

  const selectedBrand = brandId ? brands.find((b) => b.id === brandId) : null;
  const selectedBrandLabel = selectedBrand
    ? [selectedBrand.name, selectedBrand.websiteUrl, selectedBrand.userEmail].filter(Boolean).join(' · ')
    : brandId
      ? brandId
      : '';

  const buildParams = useCallback(
    (updates: { userId?: string; brandId?: string }) => {
      const params = new URLSearchParams();
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      if (updates.userId !== undefined) {
        if (updates.userId) params.set('userId', updates.userId);
      } else if (userId) params.set('userId', userId);
      if (updates.brandId !== undefined) {
        if (updates.brandId) params.set('brandId', updates.brandId);
      } else if (brandId) params.set('brandId', brandId);
      return params.toString();
    },
    [dateFrom, dateTo, userId, brandId]
  );

  const handleUserChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const next = e.target.value;
      const q = buildParams({ userId: next });
      router.push(q ? `${pathname}?${q}` : pathname);
    },
    [buildParams, router, pathname]
  );

  const handleBrandSelect = useCallback(
    (id: string) => {
      const q = buildParams({ brandId: id });
      router.push(q ? `${pathname}?${q}` : pathname);
      setBrandDropdownOpen(false);
      setBrandSearch('');
    },
    [buildParams, router, pathname]
  );

  const handleBrandClear = useCallback(() => {
    const q = buildParams({ brandId: '' });
    router.push(q ? `${pathname}?${q}` : pathname);
    setBrandDropdownOpen(false);
    setBrandSearch('');
  }, [buildParams, router, pathname]);

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

      <div className="flex flex-col gap-4 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold text-gray-900">Ads Analytics</h1>
          <AdminDateFilter />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="ads-analytics-user" className="text-sm font-medium text-gray-700">
              User
            </label>
            <select
              id="ads-analytics-user"
              value={userId}
              onChange={handleUserChange}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm min-w-[200px] bg-white"
              aria-label="Filter by user"
            >
              <option value="">All users</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.displayName || u.email}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1 relative">
            <label htmlFor="ads-analytics-brand" className="text-sm font-medium text-gray-700">
              Brand
            </label>
            <div className="relative min-w-[240px]">
              <input
                id="ads-analytics-brand"
                type="text"
                value={brandDropdownOpen ? brandSearch : selectedBrandLabel}
                onChange={(e) => {
                  setBrandSearch(e.target.value);
                  setBrandDropdownOpen(true);
                }}
                onFocus={() => setBrandDropdownOpen(true)}
                onBlur={() => setTimeout(() => setBrandDropdownOpen(false), 200)}
                placeholder="All brands or search..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                aria-label="Filter by brand"
                aria-autocomplete="list"
                aria-expanded={brandDropdownOpen}
              />
              {brandId && (
                <button
                  type="button"
                  onClick={handleBrandClear}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                  aria-label="Clear brand filter"
                >
                  Clear
                </button>
              )}
              {brandDropdownOpen && (
                <ul
                  className="absolute z-10 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg py-1"
                  role="listbox"
                >
                  <li role="option">
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleBrandClear();
                      }}
                    >
                      All brands
                    </button>
                  </li>
                  {brands.map((b) => (
                    <li key={b.id} role="option">
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleBrandSelect(b.id);
                        }}
                      >
                        {[b.name, b.websiteUrl, b.userEmail].filter(Boolean).join(' · ')}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

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

          {/* Section 5: User Engagement Metrics */}
          <UserEngagementChart data={data?.topUsers || []} isLoading={isLoading} />

          {/* Section 6: Action Conversion & Engagement Rates */}
          <ActionConversionChart data={data?.conversionRates} isLoading={isLoading} />

          {/* Section 7: Recent Activity Timeline */}
          <RecentActivityTimeline data={data?.recentActivity || []} isLoading={isLoading} />
        </div>
      )}
    </div>
  );
}

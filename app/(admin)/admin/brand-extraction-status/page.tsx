'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdminCard } from '@/components/admin/AdminCard';
import { AdminTable, AdminTableRow, AdminTableCell } from '@/components/admin/AdminTable';
import { Pagination } from '@/components/admin/Pagination';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function StatusBadge({ status, error }: { status: string | null; error: string | null }) {
  const isSuccess = status === 'success';
  const hasError = !!error;
  const isPending = status === 'pending' || !status;
  const isFailed = hasError || (status && status !== 'success' && status !== 'pending');

  let label = status || 'pending';
  let className = 'px-2 py-0.5 text-xs font-medium rounded ';
  if (isSuccess) className += 'bg-green-100 text-green-800';
  else if (isFailed) className += 'bg-red-100 text-red-800';
  else if (isPending) className += 'bg-gray-100 text-gray-600';
  else className += 'bg-yellow-100 text-yellow-800';

  return (
    <span title={error || undefined} className={className}>
      {label}
      {hasError && ' (!)'}
    </span>
  );
}

export default function BrandExtractionStatusPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [problemsOnly, setProblemsOnly] = useState(false);

  const { data, error, isLoading } = useSWR(
    `/api/admin/brand-extraction-status?page=${page}&limit=50&problemsOnly=${problemsOnly}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  if (error) {
    return (
      <div className="p-8">
        <div className="text-center py-8 text-red-600">Error loading brand extraction status.</div>
      </div>
    );
  }

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/admin" className="text-blue-600 hover:text-blue-800">
          ← Back to Admin
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">Brand Extraction Status</h1>
      <p className="text-gray-600 mb-8">
        Monitor extraction steps (colors, fonts, logo, hero, insights) per brand. Use &quot;Problems only&quot; to see brands with failures or errors.
      </p>

      <AdminCard>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={problemsOnly}
              onChange={(e) => {
                setProblemsOnly(e.target.checked);
                setPage(1);
              }}
              className="rounded border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700">Problems only</span>
          </label>
          <div className="text-sm text-gray-500">
            {data?.total != null && (
              <>Total: {data.total} brand{data.total !== 1 ? 's' : ''}</>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <>
            <AdminTable
              headers={[
                'Brand',
                'Website',
                'Owner',
                'Colors',
                'Fonts',
                'Logo',
                'Hero',
                'Insights',
                'Updated',
                '',
              ]}
              emptyMessage={items.length === 0 ? 'No records found' : undefined}
            >
              {items.map((row: Record<string, unknown>) => (
                <AdminTableRow
                  key={String(row.id)}
                  onClick={() => router.push(`/admin/brands/${row.brandId}`)}
                  className="cursor-pointer hover:bg-gray-50"
                >
                  <AdminTableCell>{String(row.brandName ?? '—')}</AdminTableCell>
                  <AdminTableCell onClick={(e) => e.stopPropagation()}>
                    {row.brandWebsiteUrl ? (
                      <a
                        href={String(row.brandWebsiteUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 truncate block max-w-[200px]"
                      >
                        {String(row.brandWebsiteUrl)}
                      </a>
                    ) : (
                      '—'
                    )}
                  </AdminTableCell>
                  <AdminTableCell onClick={(e) => e.stopPropagation()}>
                    {row.userId ? (
                      <Link
                        href={`/admin/users/${row.userId}`}
                        className="text-blue-600 hover:text-blue-800"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {String(row.userDisplayName || row.userEmail || row.userId) || '—'}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </AdminTableCell>
                  <AdminTableCell>
                    <StatusBadge
                      status={row.colorsStatus as string | null}
                      error={row.colorsError as string | null}
                    />
                  </AdminTableCell>
                  <AdminTableCell>
                    <StatusBadge
                      status={row.fontsStatus as string | null}
                      error={row.fontsError as string | null}
                    />
                  </AdminTableCell>
                  <AdminTableCell>
                    <StatusBadge
                      status={row.logoStatus as string | null}
                      error={row.logoError as string | null}
                    />
                  </AdminTableCell>
                  <AdminTableCell>
                    <StatusBadge
                      status={row.heroStatus as string | null}
                      error={row.heroError as string | null}
                    />
                  </AdminTableCell>
                  <AdminTableCell>
                    <StatusBadge
                      status={row.insightsStatus as string | null}
                      error={row.insightsError as string | null}
                    />
                  </AdminTableCell>
                  <AdminTableCell>
                    {row.updatedAt
                      ? new Date(row.updatedAt as string).toLocaleString()
                      : '—'}
                  </AdminTableCell>
                  <AdminTableCell onClick={(e) => e.stopPropagation()}>
                    <Link
                      href={`/admin/brands/${row.brandId}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View brand
                    </Link>
                  </AdminTableCell>
                </AdminTableRow>
              ))}
            </AdminTable>

            {totalPages > 1 && (
              <Pagination
                page={data.page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </AdminCard>
    </div>
  );
}

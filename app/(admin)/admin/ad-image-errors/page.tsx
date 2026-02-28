'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdminCard } from '@/components/admin/AdminCard';
import { AdminTable, AdminTableRow, AdminTableCell } from '@/components/admin/AdminTable';
import { Pagination } from '@/components/admin/Pagination';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AdImageErrorsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);

  const { data, error, isLoading } = useSWR(
    `/api/admin/ad-image-errors?page=${page}&limit=50`,
    fetcher,
    { revalidateOnFocus: false }
  );

  if (error) {
    return (
      <div className="p-8">
        <div className="text-center py-8 text-red-600">Error loading ad image errors.</div>
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

      <h1 className="text-3xl font-bold text-gray-900 mb-2">Ad Image Errors</h1>
      <p className="text-gray-600 mb-8">
        Ad images that failed during generation. Shows workflow, archetype, time, and error message.
      </p>

      <AdminCard>
        <div className="mb-6 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {data?.total != null && (
              <>Total: {data.total} error{data.total !== 1 ? 's' : ''}</>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <>
            <AdminTable
              headers={[
                'Time',
                'Workflow',
                'Archetype',
                'Error',
                'Ad events',
                'Permanently deleted',
                'User',
                'Brand',
                'Job',
                '',
              ]}
              emptyMessage={items.length === 0 ? 'No ad image errors found' : undefined}
            >
              {items.map((row: Record<string, unknown>) => (
                <AdminTableRow
                  key={String(row.id)}
                  onClick={() => router.push(`/admin/ad-images/${row.id}`)}
                  className="cursor-pointer hover:bg-gray-50"
                >
                  <AdminTableCell>
                    {row.createdAt
                      ? new Date(row.createdAt as string).toLocaleString()
                      : '—'}
                  </AdminTableCell>
                  <AdminTableCell>
                    <span className="font-mono text-sm">
                      {row.workflowUid ? `${String(row.workflowUid)}${row.variantKey ? ` (${row.variantKey})` : ''}` : '—'}
                    </span>
                  </AdminTableCell>
                  <AdminTableCell>
                    {String(row.archetypeDisplayName ?? row.archetypeCode ?? '—')}
                  </AdminTableCell>
                  <AdminTableCell>
                    <span
                      className="text-red-700 text-sm block max-w-[280px] truncate"
                      title={String(row.errorMessage || '')}
                    >
                      {String(row.errorMessage || '—')}
                    </span>
                  </AdminTableCell>
                  <AdminTableCell>
                    <span className="text-sm" title={row.eventTypes as string | undefined}>
                      {row.eventTypes ? (
                        <>{String(row.eventTypes)}{Number(row.eventsCount ?? 0) > 0 ? ` (${row.eventsCount})` : ''}</>
                      ) : (
                        '—'
                      )}
                    </span>
                  </AdminTableCell>
                  <AdminTableCell>
                    {row.permanentlyDeleted ? (
                      <span className="px-2 py-1 rounded text-xs bg-amber-100 text-amber-800">Yes</span>
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
                        {String(row.userDisplayName || row.userEmail || 'User')}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </AdminTableCell>
                  <AdminTableCell onClick={(e) => e.stopPropagation()}>
                    {row.brandId ? (
                      <Link
                        href={`/admin/brands/${row.brandId}`}
                        className="text-blue-600 hover:text-blue-800"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {String(row.brandName || row.brandId) || '—'}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </AdminTableCell>
                  <AdminTableCell onClick={(e) => e.stopPropagation()}>
                    {row.jobId ? (
                      <Link
                        href={`/admin/jobs/${row.jobId}`}
                        className="text-blue-600 hover:text-blue-800 font-mono text-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {String(row.jobId).slice(0, 8)}…
                      </Link>
                    ) : (
                      '—'
                    )}
                  </AdminTableCell>
                  <AdminTableCell onClick={(e) => e.stopPropagation()}>
                    <Link
                      href={`/admin/ad-images/${row.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View image
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

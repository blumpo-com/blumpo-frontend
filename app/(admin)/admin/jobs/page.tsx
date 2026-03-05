'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { AdminCard } from '@/components/admin/AdminCard';
import { AdminTable, AdminTableRow, AdminTableCell } from '@/components/admin/AdminTable';
import { Pagination } from '@/components/admin/Pagination';
import { AdminDateFilter } from '@/components/admin/AdminDateFilter';
import { JobStatus } from '@/lib/db/schema/enums';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function JobsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1');
  const statusFilter = searchParams.get('status') || 'all';
  const dateFrom = searchParams.get('dateFrom') ?? '';
  const dateTo = searchParams.get('dateTo') ?? '';

  const queryParams = new URLSearchParams();
  queryParams.set('page', String(page));
  queryParams.set('limit', '50');
  if (statusFilter !== 'all') queryParams.set('status', statusFilter);
  if (dateFrom) queryParams.set('dateFrom', dateFrom);
  if (dateTo) queryParams.set('dateTo', dateTo);
  const jobsUrl = `/api/admin/jobs?${queryParams.toString()}`;

  const { data, error, isLoading } = useSWR(jobsUrl, fetcher, {
    revalidateOnFocus: false,
  });

  if (error) {
    return <div className="p-8">Error loading jobs</div>;
  }

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case JobStatus.SUCCEEDED:
        return 'bg-green-100 text-green-800';
      case JobStatus.FAILED:
        return 'bg-red-100 text-red-800';
      case JobStatus.RUNNING:
        return 'bg-blue-100 text-blue-800';
      case JobStatus.QUEUED:
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const setPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(newPage));
    router.push(`/admin/jobs?${params.toString()}`);
  };

  const setStatusFilter = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('status', status);
    params.set('page', '1');
    router.push(`/admin/jobs?${params.toString()}`);
  };

  return (
    <div className="p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Generation Jobs</h1>
        <AdminDateFilter />
      </div>

      <AdminCard>
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">All Status</option>
            <option value={JobStatus.QUEUED}>Queued</option>
            <option value={JobStatus.RUNNING}>Running</option>
            <option value={JobStatus.SUCCEEDED}>Succeeded</option>
            <option value={JobStatus.FAILED}>Failed</option>
            <option value={JobStatus.CANCELED}>Canceled</option>
          </select>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <>
            <AdminTable
              headers={['ID', 'User', 'Brand', 'Status', 'Tokens', 'Images', 'Created', 'Completed']}
              emptyMessage={data?.jobs?.length === 0 ? 'No jobs found' : undefined}
            >
              {data?.jobs?.map((job: any) => (
                <AdminTableRow
                  key={job.id}
                  onClick={() => router.push(`/admin/jobs/${job.id}`)}
                  className="cursor-pointer hover:bg-gray-50"
                >
                  <AdminTableCell>
                    <span className="font-mono text-xs">{job.id.slice(0, 8)}...</span>
                  </AdminTableCell>
                  <AdminTableCell onClick={(e) => e.stopPropagation()}>
                    <a
                      href={`/admin/users/${job.userId}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/admin/users/${job.userId}`);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {job.userEmail}
                    </a>
                  </AdminTableCell>
                  <AdminTableCell onClick={(e) => e.stopPropagation()}>
                    {job.brandId ? (
                      <a
                        href={`/admin/brands/${job.brandId}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/admin/brands/${job.brandId}`);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {job.brandName || '-'}
                      </a>
                    ) : (
                      '-'
                    )}
                  </AdminTableCell>
                  <AdminTableCell>
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(job.status)}`}>
                      {job.status}
                    </span>
                  </AdminTableCell>
                  <AdminTableCell>{job.tokensCost}</AdminTableCell>
                  <AdminTableCell>{job.imagesCount}</AdminTableCell>
                  <AdminTableCell>
                    {new Date(job.createdAt).toLocaleString()}
                  </AdminTableCell>
                  <AdminTableCell>
                    {job.completedAt ? new Date(job.completedAt).toLocaleString() : '-'}
                  </AdminTableCell>
                </AdminTableRow>
              ))}
            </AdminTable>

            {data && data.totalPages > 1 && (
              <Pagination
                page={data.page}
                totalPages={data.totalPages}
                onPageChange={(p) => setPage(p)}
              />
            )}
          </>
        )}
      </AdminCard>
    </div>
  );
}

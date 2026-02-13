'use client';

import { useState } from 'react';
import { AdminCard } from '@/components/admin/AdminCard';
import { AdminTable, AdminTableRow, AdminTableCell } from '@/components/admin/AdminTable';
import { Pagination } from '@/components/admin/Pagination';
import { JobStatus } from '@/lib/db/schema/enums';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function JobsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data, error, isLoading } = useSWR(
    `/api/admin/jobs?page=${page}&limit=50${statusFilter !== 'all' ? `&status=${statusFilter}` : ''}`,
    fetcher,
    { revalidateOnFocus: false }
  );

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

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Generation Jobs</h1>

      <AdminCard>
        <div className="mb-6">
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
                <AdminTableRow key={job.id}>
                  <AdminTableCell>
                    <span className="font-mono text-xs">{job.id.slice(0, 8)}...</span>
                  </AdminTableCell>
                  <AdminTableCell>{job.userEmail}</AdminTableCell>
                  <AdminTableCell>{job.brandName || '-'}</AdminTableCell>
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
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </AdminCard>
    </div>
  );
}

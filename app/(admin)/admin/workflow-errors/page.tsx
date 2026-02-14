'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminCard } from '@/components/admin/AdminCard';
import { AdminTable, AdminTableRow, AdminTableCell } from '@/components/admin/AdminTable';
import { Pagination } from '@/components/admin/Pagination';
import useSWR from 'swr';
import { useUser } from '@/lib/contexts/user-context';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function WorkflowErrorsPage() {
  const router = useRouter();
  const { user } = useUser();
  const [page, setPage] = useState(1);
  const [resolvedFilter, setResolvedFilter] = useState<string>('unresolved');
  const [errorLevelFilter, setErrorLevelFilter] = useState<string>('all');

  const { data, error, isLoading, mutate } = useSWR(
    `/api/admin/workflow-errors?page=${page}&limit=50${resolvedFilter !== 'all' ? `&isResolved=${resolvedFilter === 'resolved'}` : ''}${errorLevelFilter !== 'all' ? `&errorLevel=${errorLevelFilter}` : ''}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const handleMarkResolved = async (errorId: number) => {
    if (!user) return;

    try {
      const response = await fetch('/api/admin/workflow-errors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          errorId,
          resolvedBy: user.email || user.id,
          resolutionNote: 'Resolved via admin panel',
        }),
      });

      if (response.ok) {
        mutate();
      } else {
        alert('Failed to mark error as resolved');
      }
    } catch (error) {
      console.error('Error marking error as resolved:', error);
      alert('Error marking error as resolved');
    }
  };

  if (error) {
    return <div className="p-8">Error loading workflow errors</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Workflow Errors</h1>

      <AdminCard>
        <div className="mb-6 flex gap-4">
          <select
            value={resolvedFilter}
            onChange={(e) => setResolvedFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="unresolved">Unresolved</option>
            <option value="resolved">Resolved</option>
            <option value="all">All</option>
          </select>
          <select
            value={errorLevelFilter}
            onChange={(e) => setErrorLevelFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">All Levels</option>
            <option value="error">Error</option>
            <option value="warning">Warning</option>
          </select>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <>
            <AdminTable
              headers={['Workflow', 'Node', 'Error', 'Level', 'Occurrences', 'First Seen', 'Last Seen', 'Actions']}
              emptyMessage={data?.errors?.length === 0 ? 'No errors found' : undefined}
            >
              {data?.errors?.map((err: any) => (
                <AdminTableRow
                  key={err.id}
                  onClick={() => router.push(`/admin/workflow-errors/${err.id}`)}
                  className="cursor-pointer hover:bg-gray-50"
                >
                  <AdminTableCell>{err.workflowName || err.workflowId}</AdminTableCell>
                  <AdminTableCell>{err.nodeName || err.nodeId}</AdminTableCell>
                  <AdminTableCell>
                    <div className="max-w-md truncate" title={err.errorMessage}>
                      {err.errorMessage}
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <span className={`px-2 py-1 rounded text-xs ${
                      err.errorLevel === 'error' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {err.errorLevel || 'unknown'}
                    </span>
                  </AdminTableCell>
                  <AdminTableCell>{err.occurrencesCount}</AdminTableCell>
                  <AdminTableCell>
                    {new Date(err.firstSeenAt).toLocaleDateString()}
                  </AdminTableCell>
                  <AdminTableCell>
                    {new Date(err.lastSeenAt).toLocaleDateString()}
                  </AdminTableCell>
                  <AdminTableCell onClick={(e) => e.stopPropagation()}>
                    {!err.isResolved && (
                      <button
                        onClick={() => handleMarkResolved(err.id)}
                        className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm"
                      >
                        Mark Resolved
                      </button>
                    )}
                    {err.lastExecutionUrl && (
                      <a
                        href={err.lastExecutionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                      >
                        View
                      </a>
                    )}
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

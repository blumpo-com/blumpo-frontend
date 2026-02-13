import { getAdminUser } from '@/lib/auth/admin';
import { getWorkflowErrorWithOccurrences } from '@/lib/db/queries/admin';
import { redirect } from 'next/navigation';
import { AdminCard } from '@/components/admin/AdminCard';
import Link from 'next/link';

export default async function WorkflowErrorDetailPage({
  params,
}: {
  params: Promise<{ errorId: string }>;
}) {
  const admin = await getAdminUser();
  if (!admin) {
    redirect('/dashboard?error=unauthorized');
  }

  const errorId = parseInt(await params.then(p => p.errorId));
  if (isNaN(errorId)) {
    return <div className="p-8">Invalid error ID</div>;
  }

  const error = await getWorkflowErrorWithOccurrences(errorId);

  if (!error) {
    return <div className="p-8">Error not found</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/admin/workflow-errors" className="text-blue-600 hover:text-blue-800">
          ← Back to Workflow Errors
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">Workflow Error Details</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <AdminCard title="Error Information">
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Error ID</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono">{error.id}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Workflow Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{error.workflowName || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Node Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{error.nodeName || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Error Message</dt>
              <dd className="mt-1 text-sm text-red-600 break-words">{error.errorMessage || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1">
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    error.isResolved
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {error.isResolved ? 'Resolved' : 'Unresolved'}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">First Seen</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {error.firstSeenAt
                  ? new Date(error.firstSeenAt).toLocaleString()
                  : '-'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Last Seen</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {error.lastSeenAt
                  ? new Date(error.lastSeenAt).toLocaleString()
                  : '-'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Occurrence Count</dt>
              <dd className="mt-1 text-sm text-gray-900">{error.occurrencesCount}</dd>
            </div>
          </dl>
        </AdminCard>

        <AdminCard title="Error Details">
          <dl className="space-y-4">
            {error.workflowId && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Workflow ID</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono">{error.workflowId}</dd>
              </div>
            )}
            {error.nodeId && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Node ID</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono">{error.nodeId}</dd>
              </div>
            )}
            {error.lastExecutionId && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Execution ID</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono">{error.lastExecutionId}</dd>
              </div>
            )}
            {error.sampleStack && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Sample Stack</dt>
                <dd className="mt-1">
                  <pre className="text-xs text-gray-900 overflow-auto max-h-64 bg-gray-50 p-3 rounded border">
                    {error.sampleStack}
                  </pre>
                </dd>
              </div>
            )}
            {error.errorFingerprint && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Error Fingerprint</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono break-all">
                  {error.errorFingerprint}
                </dd>
              </div>
            )}
          </dl>
        </AdminCard>
      </div>

      {/* Error Occurrences */}
      {error.occurrences && error.occurrences.length > 0 && (
        <AdminCard title={`Error Occurrences (${error.occurrences.length})`}>
          <div className="space-y-3">
            {error.occurrences.map((occurrence) => (
              <div
                key={occurrence.id}
                className="p-4 border border-gray-200 rounded-lg bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      Occurrence #{occurrence.id}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Occurred: {new Date(occurrence.occurredAt).toLocaleString()}
                    </div>
                    {occurrence.executionId && (
                      <div className="text-xs text-gray-500 mt-1">
                        Execution ID: <span className="font-mono">{occurrence.executionId}</span>
                      </div>
                    )}
                    {occurrence.stack && (
                      <div className="mt-2">
                        <div className="text-xs font-medium text-gray-700 mb-1">Stack Trace:</div>
                        <pre className="text-xs text-gray-600 overflow-auto max-h-32 bg-white p-2 rounded border">
                          {occurrence.stack}
                        </pre>
                      </div>
                    )}
                    {occurrence.executionUrl && (
                      <div className="mt-2">
                        <a
                          href={occurrence.executionUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          View Execution →
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AdminCard>
      )}
    </div>
  );
}

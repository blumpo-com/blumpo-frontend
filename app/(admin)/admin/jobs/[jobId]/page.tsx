import { getAdminUser } from '@/lib/auth/admin';
import { getJobWithFullDetails, getJobAdImages } from '@/lib/db/queries/admin';
import { redirect } from 'next/navigation';
import { AdminCard } from '@/components/admin/AdminCard';
import { RelatedEntitiesSection, RelatedEntity } from '@/components/admin/RelatedEntitiesSection';
import Link from 'next/link';

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const admin = await getAdminUser();
  if (!admin) {
    redirect('/dashboard?error=unauthorized');
  }

  const { jobId } = await params;
  const job = await getJobWithFullDetails(jobId);

  if (!job) {
    return <div className="p-8">Job not found</div>;
  }

  // Fetch related ad images
  const adImages = await getJobAdImages(jobId);

  // Prepare related entities
  const relatedEntities: RelatedEntity[] = [];

  // Add user
  if (job.user) {
    relatedEntities.push({
      type: 'user',
      id: job.user.id,
      label: job.user.displayName || job.user.email,
      metadata: `Creator`,
    });
  }

  // Add brand
  if (job.brand) {
    relatedEntities.push({
      type: 'brand',
      id: job.brand.id,
      label: job.brand.name,
      metadata: `Website: ${job.brand.websiteUrl}`,
    });
  }

  // Add ad images
  const adImageEntities: RelatedEntity[] = adImages.map((image) => ({
    type: 'ad-image',
    id: image.id,
    label: image.title || `Image ${image.id.slice(0, 8)}...`,
    metadata: [
      `Created: ${new Date(image.createdAt).toLocaleDateString()}`,
      image.workflowUid ? `Workflow: ${image.workflowUid}` : null,
      image.eventTypes ? `Events: ${image.eventTypes}` : (image.eventsCount ? `Events: ${image.eventsCount} total` : null),
      image.permanentlyDeleted ? 'Permanently deleted' : null,
    ].filter(Boolean).join(' • '),
  }));

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/admin/jobs" className="text-blue-600 hover:text-blue-800">
          ← Back to Jobs
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">Generation Job Details</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <AdminCard title="Job Information">
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Job ID</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono">{job.id}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1">
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    job.status === 'SUCCEEDED'
                      ? 'bg-green-100 text-green-800'
                      : job.status === 'FAILED'
                      ? 'bg-red-100 text-red-800'
                      : job.status === 'RUNNING'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {job.status}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created At</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(job.createdAt).toLocaleString()}
              </dd>
            </div>
            {job.startedAt && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Started At</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(job.startedAt).toLocaleString()}
                </dd>
              </div>
            )}
            {job.completedAt && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Completed At</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(job.completedAt).toLocaleString()}
                </dd>
              </div>
            )}
            {job.errorMessage && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Error Message</dt>
                <dd className="mt-1 text-sm text-red-600">{job.errorMessage}</dd>
              </div>
            )}
          </dl>
        </AdminCard>

        <AdminCard title="Job Details">
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Archetype Code</dt>
              <dd className="mt-1 text-sm text-gray-900">{job.archetypeCode || '-'}</dd>
            </div>
            {job.archetype && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Archetype Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{job.archetype.displayName || '-'}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-gray-500">Tokens Cost</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {job.tokensCost ? job.tokensCost.toLocaleString() : '0'} tokens
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Images Generated</dt>
              <dd className="mt-1 text-sm text-gray-900">{job.imagesCount}</dd>
            </div>
            {job.ledgerEntry && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Token Ledger Entry</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <Link
                    href={`/admin/users/${job.userId}#ledger`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    View Ledger Entry
                  </Link>
                </dd>
              </div>
            )}
          </dl>
        </AdminCard>

        {job.prompt && (
          <AdminCard title="Prompt">
            <p className="text-sm text-gray-900 whitespace-pre-wrap">{job.prompt}</p>
          </AdminCard>
        )}

        {(() => {
          if (job.params && typeof job.params === 'object' && job.params !== null && Object.keys(job.params).length > 0) {
            return (
              <AdminCard title="Parameters">
                <pre className="text-xs text-gray-900 overflow-auto max-h-64">
                  {JSON.stringify(job.params, null, 2)}
                </pre>
              </AdminCard>
            );
          }
          return null;
        })()}
      </div>

      {/* Related Entities Section */}
      <div className="space-y-6 mt-6">
        <RelatedEntitiesSection
          title="Related Entities"
          entities={relatedEntities}
          emptyMessage="No related entities found."
        />

        <RelatedEntitiesSection
          title="Generated Ad Images"
          entities={adImageEntities}
          viewAllHref={`/admin/ad-images?jobId=${jobId}`}
          emptyMessage="No ad images generated for this job."
        />
      </div>
    </div>
  );
}

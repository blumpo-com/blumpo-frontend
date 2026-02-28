import { getAdminUser } from '@/lib/auth/admin';
import { getAdImageWithFullDetails, getAdImageEvents } from '@/lib/db/queries/admin';
import { redirect } from 'next/navigation';
import { AdminCard } from '@/components/admin/AdminCard';
import { RelatedEntitiesSection, RelatedEntity } from '@/components/admin/RelatedEntitiesSection';
import Link from 'next/link';

export default async function AdImageDetailPage({
  params,
}: {
  params: Promise<{ imageId: string }>;
}) {
  const admin = await getAdminUser();
  if (!admin) {
    redirect('/dashboard?error=unauthorized');
  }

  const { imageId } = await params;
  const image = await getAdImageWithFullDetails(imageId);

  if (!image) {
    return <div className="p-8">Ad Image not found</div>;
  }

  // Fetch related events
  const events = await getAdImageEvents(imageId, 20);

  // Prepare related entities
  const relatedEntities: RelatedEntity[] = [];

  // Add user
  if (image.user) {
    relatedEntities.push({
      type: 'user',
      id: image.user.id,
      label: image.user.displayName || image.user.email,
      metadata: `Owner`,
    });
  }

  // Add brand
  if (image.brand) {
    relatedEntities.push({
      type: 'brand',
      id: image.brand.id,
      label: image.brand.name,
      metadata: `Website: ${image.brand.websiteUrl}`,
    });
  }

  // Add job
  if (image.job) {
    relatedEntities.push({
      type: 'job',
      id: image.job.id,
      label: `Job ${image.job.id.slice(0, 8)}...`,
      metadata: `Status: ${image.job.status} • Created: ${new Date(image.job.createdAt).toLocaleDateString()}`,
    });
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/admin/ad-images" className="text-blue-600 hover:text-blue-800">
          ← Back to Ad Images
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">Ad Image Details</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <AdminCard title="Image Information">
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Image ID</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono">{image.id}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Title</dt>
              <dd className="mt-1 text-sm text-gray-900">{image.title || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created At</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(image.createdAt).toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1">
                <div className="flex gap-2 flex-wrap">
                  {image.permanentlyDeleted && (
                    <span className="px-2 py-1 rounded text-xs bg-amber-100 text-amber-800">
                      Permanently deleted
                    </span>
                  )}
                  {image.banFlag && (
                    <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-800">
                      Banned
                    </span>
                  )}
                  {image.errorFlag && (
                    <span className="px-2 py-1 rounded text-xs bg-orange-100 text-orange-800">
                      Error
                    </span>
                  )}
                  {image.isDeleted && (
                    <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-800">
                      Deleted
                    </span>
                  )}
                  {image.readyToDisplay && !image.isDeleted && (
                    <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                      Ready
                    </span>
                  )}
                </div>
              </dd>
            </div>
            {image.errorMessage && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Error Message</dt>
                <dd className="mt-1 text-sm text-red-600">{image.errorMessage}</dd>
              </div>
            )}
          </dl>
        </AdminCard>

        <AdminCard title="Image Properties">
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Dimensions</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {image.width} × {image.height}px
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Format</dt>
              <dd className="mt-1 text-sm text-gray-900">{image.format}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">File Size</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {(image.bytesSize / 1024 / 1024).toFixed(2)} MB
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Storage Key</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono text-xs break-all">
                {image.storageKey}
              </dd>
            </div>
            {image.publicUrl && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Public URL</dt>
                <dd className="mt-1">
                  <a
                    href={image.publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm break-all"
                  >
                    {image.publicUrl}
                  </a>
                </dd>
              </div>
            )}
            {image.deleteAt && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Scheduled Deletion</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(image.deleteAt).toLocaleString()}
                </dd>
              </div>
            )}
          </dl>
        </AdminCard>

        {image.publicUrl && (
          <div className="md:col-span-2">
            <AdminCard title="Image Preview">
              <div className="flex justify-center">
                <img
                  src={image.publicUrl}
                  alt={image.title || 'Ad Image'}
                  className="max-w-full max-h-96 rounded-lg shadow-lg"
                />
              </div>
            </AdminCard>
          </div>
        )}

        {image.workflow && (
          <AdminCard title="Workflow Information">
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Workflow ID</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono">{image.workflow.id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Workflow UID</dt>
                <dd className="mt-1 text-sm text-gray-900">{image.workflow.workflowUid}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Variant Key</dt>
                <dd className="mt-1 text-sm text-gray-900">{image.workflow.variantKey}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Archetype Code</dt>
                <dd className="mt-1 text-sm text-gray-900">{image.workflow.archetypeCode}</dd>
              </div>
              {image.workflow.format && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Format</dt>
                  <dd className="mt-1 text-sm text-gray-900">{image.workflow.format}</dd>
                </div>
              )}
            </dl>
          </AdminCard>
        )}
      </div>

      {/* Related Entities Section */}
      <div className="space-y-6 mt-6">
        <RelatedEntitiesSection
          title="Related Entities"
          entities={relatedEntities}
          emptyMessage="No related entities found."
        />

        {events.length > 0 && (
          <AdminCard title={`Ad Events (${image.eventsCount})`}>
            <div className="space-y-3">
              {events.map((event) => {
                let metadataStr: string | null = null;
                if (event.metadata && typeof event.metadata === 'object' && event.metadata !== null) {
                  try {
                    metadataStr = JSON.stringify(event.metadata);
                  } catch {
                    metadataStr = null;
                  }
                }
                return (
                  <div
                    key={event.id}
                    className="p-3 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm text-gray-900">
                          {event.eventType}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Source: {event.eventSource || 'N/A'}
                        </div>
                        {metadataStr && (
                          <div className="text-xs text-gray-500 mt-1">
                            {metadataStr}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(event.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </AdminCard>
        )}
      </div>
    </div>
  );
}

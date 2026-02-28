import { getAdminUser } from '@/lib/auth/admin';
import {
  getBrandWithFullDetails,
  getBrandJobs,
  getBrandAdImages,
  getArchetypeGenerationStatsByBrand,
  getWorkflowGenerationCountsByBrand,
} from '@/lib/db/queries/admin';
import { redirect } from 'next/navigation';
import { AdminCard } from '@/components/admin/AdminCard';
import { RelatedEntitiesSection, RelatedEntity } from '@/components/admin/RelatedEntitiesSection';
import Link from 'next/link';

export default async function BrandDetailPage({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const admin = await getAdminUser();
  if (!admin) {
    redirect('/dashboard?error=unauthorized');
  }

  const { brandId } = await params;
  const brand = await getBrandWithFullDetails(brandId);

  if (!brand) {
    return <div className="p-8">Brand not found</div>;
  }

  // Fetch related entities
  const [jobs, adImages, archetypeStats, workflowCounts] = await Promise.all([
    getBrandJobs(brandId, 10),
    getBrandAdImages(brandId, 10),
    getArchetypeGenerationStatsByBrand(brandId),
    getWorkflowGenerationCountsByBrand(brandId),
  ]);

  // Prepare related entities for display
  const relatedEntities: RelatedEntity[] = [];

  // Add user
  if (brand.user) {
    relatedEntities.push({
      type: 'user',
      id: brand.user.id,
      label: brand.user.displayName || brand.user.email,
      metadata: `Owner`,
    });
  }

  // Add jobs
  const jobEntities: RelatedEntity[] = jobs.map((job) => ({
    type: 'job',
    id: job.id,
    label: `Job ${job.id.slice(0, 8)}...`,
    metadata: `Status: ${job.status} • Created: ${new Date(job.createdAt).toLocaleDateString()}`,
  }));

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
        <Link href="/admin/brands" className="text-blue-600 hover:text-blue-800">
          ← Back to Brands
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">Brand Details</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <AdminCard title="Brand Information">
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{brand.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Website URL</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <a
                  href={brand.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  {brand.websiteUrl}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Language</dt>
              <dd className="mt-1 text-sm text-gray-900">{brand.language}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created At</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(brand.createdAt).toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Updated At</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(brand.updatedAt).toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1">
                <span className={`px-2 py-1 rounded text-xs ${brand.isDeleted ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                  {brand.isDeleted ? 'Deleted' : 'Active'}
                </span>
              </dd>
            </div>
          </dl>
        </AdminCard>

        <AdminCard title="Brand Assets">
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Colors</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {brand.colors && brand.colors.length > 0 ? (
                  <div className="flex gap-2 flex-wrap">
                    {brand.colors.map((color, idx) => (
                      <span
                        key={idx}
                        className="inline-block w-6 h-6 rounded border border-gray-300"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                ) : (
                  '-'
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Photos</dt>
              <dd className="mt-1 text-sm text-gray-900">{brand.photos?.length || 0}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Hero Photos</dt>
              <dd className="mt-1 text-sm text-gray-900">{brand.heroPhotos?.length || 0}</dd>
            </div>
            {brand.logoUrl && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Logo</dt>
                <dd className="mt-1">
                  <img
                    src={brand.logoUrl}
                    alt={`${brand.name} logo`}
                    className="h-12 w-auto"
                  />
                </dd>
              </div>
            )}
          </dl>
        </AdminCard>

        {brand.insights && (
          <AdminCard title="Brand Insights">
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Created At</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {brand.insights.createdAt
                    ? new Date(brand.insights.createdAt).toLocaleString()
                    : '-'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Updated At</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {brand.insights.updatedAt
                    ? new Date(brand.insights.updatedAt).toLocaleString()
                    : '-'}
                </dd>
              </div>
              {/* Add more insight fields as needed */}
            </dl>
          </AdminCard>
        )}

        {brand.extractionStatus && (
          <AdminCard title="Extraction Status">
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Colors Status</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {brand.extractionStatus.colorsStatus || '-'}
                  {brand.extractionStatus.colorsError && (
                    <span className="ml-2 text-xs text-red-600">
                      ({brand.extractionStatus.colorsError})
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Fonts Status</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {brand.extractionStatus.fontsStatus || '-'}
                  {brand.extractionStatus.fontsError && (
                    <span className="ml-2 text-xs text-red-600">
                      ({brand.extractionStatus.fontsError})
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Logo Status</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {brand.extractionStatus.logoStatus || '-'}
                  {brand.extractionStatus.logoError && (
                    <span className="ml-2 text-xs text-red-600">
                      ({brand.extractionStatus.logoError})
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Hero Status</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {brand.extractionStatus.heroStatus || '-'}
                  {brand.extractionStatus.heroError && (
                    <span className="ml-2 text-xs text-red-600">
                      ({brand.extractionStatus.heroError})
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Insights Status</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {brand.extractionStatus.insightsStatus || '-'}
                  {brand.extractionStatus.insightsError && (
                    <span className="ml-2 text-xs text-red-600">
                      ({brand.extractionStatus.insightsError})
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {brand.extractionStatus.updatedAt
                    ? new Date(brand.extractionStatus.updatedAt).toLocaleString()
                    : '-'}
                </dd>
              </div>
            </dl>
          </AdminCard>
        )}
      </div>

      <div className="mt-6 space-y-6">
        {archetypeStats.length > 0 && (
          <AdminCard title="Workflow generation by archetype">
            <p className="text-sm text-gray-500 mb-4">
              For each archetype: workflows used by this brand out of total workflow variants available (e.g. 4/23 = 4 workflows generated from 23 in archetype).
            </p>
            <ul className="space-y-2">
              {archetypeStats.map((row) => (
                <li key={row.archetypeCode} className="flex justify-between items-baseline text-sm">
                  <span className="font-medium text-gray-900">
                    {row.archetypeDisplayName} ({row.archetypeCode})
                  </span>
                  <span className="text-gray-600 font-mono">
                    {Number(row.distinctWorkflowsUsed)}/{Number(row.totalWorkflowsInArchetype)}
                  </span>
                </li>
              ))}
            </ul>
          </AdminCard>
        )}

        {workflowCounts.filter((w) => Number(w.count) > 1).length > 0 && (
          <AdminCard title="Workflows used more than once">
            <p className="text-sm text-gray-500 mb-4">
              Workflows used in more than one generation (job) for this brand.
            </p>
            <ul className="space-y-4">
              {workflowCounts
                .filter((w) => Number(w.count) > 1)
                .map((w) => {
                  const ids: string[] =
                    typeof w.jobIds === 'string'
                      ? w.jobIds.split(',').map((s) => s.trim()).filter(Boolean)
                      : [];
                  return (
                    <li key={w.workflowId} className="text-sm">
                      <div className="flex justify-between items-baseline">
                        <span className="font-mono text-gray-900">
                          {w.workflowUid}
                          {w.variantKey ? ` (${w.variantKey})` : ''}
                        </span>
                        <span className="text-gray-600">{Number(w.count)} generation{Number(w.count) !== 1 ? 's' : ''}</span>
                      </div>
                      {ids.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                          {ids.map((jobId) => (
                            <Link
                              key={jobId}
                              href={`/admin/jobs/${jobId.trim()}`}
                              className="text-blue-600 hover:text-blue-800 font-mono text-xs"
                            >
                              Job {jobId.trim().slice(0, 8)}…
                            </Link>
                          ))}
                        </div>
                      )}
                    </li>
                  );
                })}
            </ul>
          </AdminCard>
        )}
      </div>

      {/* Related Entities Section */}
      <div className="space-y-6 mt-6">
        {brand.user && (
          <RelatedEntitiesSection
            title="Owner"
            entities={[
              {
                type: 'user',
                id: brand.user.id,
                label: brand.user.displayName || brand.user.email,
                metadata: `Email: ${brand.user.email}`,
              },
            ]}
          />
        )}

        <RelatedEntitiesSection
          title="Generation Jobs"
          entities={jobEntities}
          viewAllHref={`/admin/jobs?brandId=${brandId}`}
          emptyMessage="No generation jobs found for this brand."
        />

        <RelatedEntitiesSection
          title="Ad Images"
          entities={adImageEntities}
          viewAllHref={`/admin/ad-images?brandId=${brandId}`}
          emptyMessage="No ad images found for this brand."
        />
      </div>
    </div>
  );
}

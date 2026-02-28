import { getAdminUser } from '@/lib/auth/admin';
import {
  getUserWithDetails,
  getUserBrands,
  getUserJobs,
  getUserAdImages,
  getUserTokenLedger,
  getArchetypeGenerationStatsByUser,
  getWorkflowGenerationCountsByUser,
} from '@/lib/db/queries/admin';
import { redirect } from 'next/navigation';
import { AdminCard } from '@/components/admin/AdminCard';
import { RelatedEntitiesSection, RelatedEntity } from '@/components/admin/RelatedEntitiesSection';
import Link from 'next/link';

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const admin = await getAdminUser();
  if (!admin) {
    redirect('/dashboard?error=unauthorized');
  }

  const { userId } = await params;
  const [user, brands, jobs, adImages, tokenLedgerEntries, archetypeStats, workflowCounts] = await Promise.all([
    getUserWithDetails(userId),
    getUserBrands(userId, 10),
    getUserJobs(userId, 10),
    getUserAdImages(userId, 10),
    getUserTokenLedger(userId, 10),
    getArchetypeGenerationStatsByUser(userId),
    getWorkflowGenerationCountsByUser(userId),
  ]);

  if (!user) {
    return <div className="p-8">User not found</div>;
  }

  // Prepare related entities
  const brandEntities: RelatedEntity[] = brands.map((brand) => ({
    type: 'brand',
    id: brand.id,
    label: brand.name,
    metadata: `Website: ${brand.websiteUrl} • Created: ${new Date(brand.createdAt).toLocaleDateString()}`,
  }));

  const jobEntities: RelatedEntity[] = jobs.map((job) => ({
    type: 'job',
    id: job.id,
    label: `Job ${job.id.slice(0, 8)}...`,
    metadata: `Status: ${job.status} • Created: ${new Date(job.createdAt).toLocaleDateString()} • Cost: ${job.tokensCost?.toLocaleString() || 0} tokens`,
  }));

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
        <Link href="/admin/users" className="text-blue-600 hover:text-blue-800">
          ← Back to Users
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">User Details</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AdminCard title="User Information">
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Display Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{user.displayName || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Role</dt>
              <dd className="mt-1 text-sm text-gray-900">{user.role}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1">
                <span className={`px-2 py-1 rounded text-xs ${user.banFlag ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                  {user.banFlag ? 'Banned' : 'Active'}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created At</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(user.createdAt).toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Last Login</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}
              </dd>
            </div>
          </dl>
        </AdminCard>

        <AdminCard title="Token Account">
          {user.tokenAccount ? (
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Balance</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {user.tokenAccount.balance.toLocaleString()} tokens
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Plan</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.tokenAccount.planCode}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Period</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.tokenAccount.period}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Last refill</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {user.tokenAccount.lastRefillAt
                    ? new Date(user.tokenAccount.lastRefillAt).toLocaleString()
                    : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Next refill</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {user.tokenAccount.nextRefillAt
                    ? new Date(user.tokenAccount.nextRefillAt).toLocaleString()
                    : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Subscription Status</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {user.tokenAccount.subscriptionStatus || 'N/A'}
                </dd>
              </div>
              {/* Stripe data – for paid plans show missing fields in red */}
              {user.tokenAccount.planCode !== 'FREE' && (
                <>
                  <div className="border-t border-gray-200 pt-3 mt-1">
                    <dt className="text-sm font-medium text-gray-500 mb-2">Stripe data</dt>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Stripe Customer ID</dt>
                    <dd className="mt-1 text-sm">
                      {user.tokenAccount.stripeCustomerId ? (
                        <span className="text-gray-900 font-mono break-all">{user.tokenAccount.stripeCustomerId}</span>
                      ) : (
                        <span className="text-red-600 font-medium">Not set</span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Stripe Subscription ID</dt>
                    <dd className="mt-1 text-sm">
                      {user.tokenAccount.stripeSubscriptionId ? (
                        <span className="text-gray-900 font-mono break-all">{user.tokenAccount.stripeSubscriptionId}</span>
                      ) : (
                        <span className="text-red-600 font-medium">Not set</span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Stripe Product ID</dt>
                    <dd className="mt-1 text-sm">
                      {user.tokenAccount.stripeProductId ? (
                        <span className="text-gray-900 font-mono break-all">{user.tokenAccount.stripeProductId}</span>
                      ) : (
                        <span className="text-red-600 font-medium">Not set</span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Stripe Price ID</dt>
                    <dd className="mt-1 text-sm">
                      {user.tokenAccount.stripePriceId ? (
                        <span className="text-gray-900 font-mono break-all">{user.tokenAccount.stripePriceId}</span>
                      ) : (
                        <span className="text-red-600 font-medium">Not set</span>
                      )}
                    </dd>
                  </div>
                </>
              )}
            </dl>
          ) : (
            <p className="text-sm text-gray-500">No token account found</p>
          )}
        </AdminCard>

        <AdminCard title="Statistics">
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Brands</dt>
              <dd className="mt-1 text-sm text-gray-900">{user.brandsCount}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Generation Jobs</dt>
              <dd className="mt-1 text-sm text-gray-900">{user.jobsCount}</dd>
            </div>
          </dl>
        </AdminCard>
      </div>

      <div className="mt-6 space-y-6">
        {archetypeStats.length > 0 && (
          <AdminCard title="Workflow generation by archetype">
            <p className="text-sm text-gray-500 mb-4">
              For each archetype: workflows used by this user out of total workflow variants available (e.g. 4/23 = 4 workflows generated from 23 in archetype).
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
              Workflows used in more than one generation (job) for this user.
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
        <RelatedEntitiesSection
          title="Brands"
          entities={brandEntities}
          viewAllHref={`/admin/brands?userId=${userId}`}
          emptyMessage="No brands found for this user."
        />

        <RelatedEntitiesSection
          title="Generation Jobs"
          entities={jobEntities}
          viewAllHref={`/admin/jobs?userId=${userId}`}
          emptyMessage="No generation jobs found for this user."
        />

        <RelatedEntitiesSection
          title="Ad Images"
          entities={adImageEntities}
          viewAllHref={`/admin/ad-images?userId=${userId}`}
          emptyMessage="No ad images found for this user."
        />

        {tokenLedgerEntries.length > 0 && (
          <AdminCard title={`Recent Token Ledger Entries (${tokenLedgerEntries.length})`}>
            <div className="space-y-3">
              {tokenLedgerEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-3 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm text-gray-900">
                        {entry.reason || 'Transaction'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(entry.occurredAt).toLocaleString()}
                      </div>
                      {entry.referenceId && (
                        <div className="text-xs text-gray-500 mt-1">
                          Reference: <span className="font-mono">{entry.referenceId}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-sm font-semibold ${
                          entry.delta >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {entry.delta >= 0 ? '+' : ''}
                        {entry.delta.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Balance: {entry.balanceAfter.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </AdminCard>
        )}
      </div>
    </div>
  );
}

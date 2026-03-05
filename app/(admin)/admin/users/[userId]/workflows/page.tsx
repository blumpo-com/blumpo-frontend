import { getAdminUser } from '@/lib/auth/admin';
import {
  getUserWithDetails,
  getArchetypeGenerationStatsByUser,
  getWorkflowGenerationCountsByUser,
  getWorkflowsNotUsedByUser,
  getArchetypeActionCountsByUser,
  getWorkflowActionCountsByUser,
} from '@/lib/db/queries/admin';
import { getAdArchetypes } from '@/lib/db/queries/ads';
import { redirect } from 'next/navigation';
import { AdminCard } from '@/components/admin/AdminCard';
import Link from 'next/link';
import { ArchetypeActionChart } from '@/components/admin/charts/ArchetypeActionChart';
import { WorkflowActionChart } from '@/components/admin/charts/WorkflowActionChart';

export default async function UserWorkflowsPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams?: Promise<{ archetype?: string }>;
}) {
  const admin = await getAdminUser();
  if (!admin) {
    redirect('/dashboard?error=unauthorized');
  }

  const { userId } = await params;
  const resolvedSearchParams = (await (searchParams ?? Promise.resolve({}))) as { archetype?: string };
  const archetypeFilter = resolvedSearchParams?.archetype ?? undefined;

  const [user, archetypeStats, workflowCounts, archetypes, workflowsNotUsed, archetypeActions, workflowActions] =
    await Promise.all([
      getUserWithDetails(userId),
      getArchetypeGenerationStatsByUser(userId),
      getWorkflowGenerationCountsByUser(userId),
      getAdArchetypes(),
      getWorkflowsNotUsedByUser(userId, archetypeFilter),
      getArchetypeActionCountsByUser(userId),
      getWorkflowActionCountsByUser(userId),
    ]);

  if (!user) {
    return <div className="p-8">User not found</div>;
  }

  const titleLabel = user.displayName || user.email;
  const reusedWorkflows = workflowCounts.filter((w) => Number(w.count) > 1);

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href={`/admin/users/${userId}`} className="text-blue-600 hover:text-blue-800">
          ← Back to User
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Workflow details – {titleLabel}
      </h1>

      <div className="space-y-6">
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

        {reusedWorkflows.length > 0 && (
          <AdminCard title="Workflows used more than once">
            <p className="text-sm text-gray-500 mb-4">
              Workflows used in more than one generation (job) for this user.
            </p>
            <ul className="space-y-4">
              {reusedWorkflows.map((w) => {
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
                      <span className="text-gray-600">
                        {Number(w.count)} generation{Number(w.count) !== 1 ? 's' : ''}
                      </span>
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

        <AdminCard title="Workflows not generated">
          <p className="text-sm text-gray-500 mb-4">
            Workflows in the catalog that this user has never used. Filter by archetype below.
          </p>
          <form method="get" action={`/admin/users/${userId}/workflows`} className="mb-4 flex items-center gap-2">
            <label htmlFor="archetype" className="text-sm font-medium text-gray-700">
              Archetype
            </label>
            <select
              id="archetype"
              name="archetype"
              defaultValue={archetypeFilter ?? ''}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All archetypes</option>
              {archetypes.map((a) => (
                <option key={a.code} value={a.code}>
                  {a.displayName} ({a.code})
                </option>
              ))}
            </select>
            <button type="submit" className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium">
              Filter
            </button>
          </form>
          {workflowsNotUsed.length === 0 ? (
            <p className="text-sm text-gray-600">
              {archetypeFilter
                ? 'No unused workflows in this archetype.'
                : 'User has generated with all workflow variants (or there are no workflows in the catalog).'}
            </p>
          ) : (
            <ul className="space-y-2">
              {workflowsNotUsed.map((w) => (
                <li key={w.id} className="text-sm font-mono text-gray-900">
                  {w.workflowUid}
                  {w.variantKey ? ` (${w.variantKey})` : ''}
                  {w.archetypeDisplayName && (
                    <span className="ml-2 text-gray-500 font-sans">
                      – {w.archetypeDisplayName}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </AdminCard>

        <ArchetypeActionChart
          data={archetypeActions.map((r) => ({
            archetypeCode: r.archetypeCode,
            displayName: r.displayName,
            eventType: r.eventType,
            count: Number(r.count),
          }))}
        />
        <WorkflowActionChart
          data={workflowActions
            .filter((r): r is typeof r & { workflowId: string } => r.workflowId != null)
            .map((r) => ({
              workflowId: r.workflowId,
              workflowUid: r.workflowUid,
              variantKey: r.variantKey,
              archetypeCode: r.archetypeCode,
              archetypeDisplayName: r.archetypeDisplayName,
              eventType: r.eventType,
              count: Number(r.count),
            }))}
        />
      </div>
    </div>
  );
}

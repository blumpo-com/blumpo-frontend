'use client';

import { AdminCard } from '../AdminCard';
import Link from 'next/link';

interface RecentActivityTimelineProps {
  data: Array<{
    id: number;
    createdAt: Date | string;
    eventType: string;
    eventSource: string | null;
    userId: string | null;
    userEmail: string | null;
    userDisplayName: string | null;
    brandId: string | null;
    brandName: string | null;
    jobId: string | null;
    adImageId: string | null;
    archetypeCode: string | null;
    archetypeDisplayName: string | null;
    workflowId: string | null;
    workflowUid: string | null;
    variantKey: string | null;
  }>;
  isLoading?: boolean;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  saved: 'Saved',
  deleted: 'Deleted',
  restored: 'Restored',
  downloaded: 'Downloaded',
  shared: 'Shared',
  auto_delete: 'Auto Deleted',
};

const EVENT_COLORS: Record<string, string> = {
  saved: 'bg-green-100 text-green-800',
  deleted: 'bg-red-100 text-red-800',
  restored: 'bg-blue-100 text-blue-800',
  downloaded: 'bg-purple-100 text-purple-800',
  shared: 'bg-yellow-100 text-yellow-800',
  auto_delete: 'bg-gray-100 text-gray-800',
};

function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const eventDate = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - eventDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function RecentActivityTimeline({ data, isLoading }: RecentActivityTimelineProps) {
  if (isLoading) {
    return (
      <AdminCard title="Recent Activity Timeline">
        <div className="h-64 flex items-center justify-center text-gray-500">
          Loading...
        </div>
      </AdminCard>
    );
  }

  if (!data || data.length === 0) {
    return (
      <AdminCard title="Recent Activity Timeline">
        <div className="h-64 flex items-center justify-center text-gray-500">
          No recent activity
        </div>
      </AdminCard>
    );
  }

  return (
    <AdminCard title="Recent Activity Timeline">
      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {data.map((activity) => {
          const eventLabel = EVENT_TYPE_LABELS[activity.eventType] || activity.eventType;
          const eventColor = EVENT_COLORS[activity.eventType] || 'bg-gray-100 text-gray-800';
          const userName = activity.userDisplayName || activity.userEmail?.split('@')[0] || 'Unknown User';
          const archetypeDisplay = activity.archetypeDisplayName || activity.archetypeCode || 'Unknown';
          const workflowDisplay = activity.workflowUid 
            ? `${activity.workflowUid}${activity.variantKey ? ` (${activity.variantKey})` : ''}`
            : null;

          return (
            <div
              key={activity.id}
              className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {/* Timeline dot */}
              <div className="flex-shrink-0 mt-1">
                <div className={`w-3 h-3 rounded-full ${eventColor.replace('bg-', 'bg-').replace('text-', 'border-2 border-')}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-1 text-xs font-semibold rounded ${eventColor}`}>
                    {eventLabel}
                  </span>
                  {activity.eventSource && (
                    <span className="text-xs text-gray-500">
                      via {activity.eventSource}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {formatTimeAgo(activity.createdAt)}
                  </span>
                </div>

                <div className="mt-2 space-y-1 text-sm">
                  {activity.userId && (
                    <div>
                      <span className="text-gray-600">User: </span>
                      <Link
                        href={`/admin/users/${activity.userId}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                      >
                        {userName}
                      </Link>
                      {activity.userEmail && (
                        <span className="text-gray-400 ml-1">({activity.userEmail})</span>
                      )}
                    </div>
                  )}

                  {activity.brandId && activity.brandName && (
                    <div>
                      <span className="text-gray-600">Brand: </span>
                      <Link
                        href={`/admin/brands/${activity.brandId}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                      >
                        {activity.brandName}
                      </Link>
                    </div>
                  )}

                  {activity.archetypeCode && (
                    <div>
                      <span className="text-gray-600">Archetype: </span>
                      <span className="font-medium">{archetypeDisplay}</span>
                    </div>
                  )}

                  {workflowDisplay && (
                    <div>
                      <span className="text-gray-600">Workflow: </span>
                      <span className="font-medium">{workflowDisplay}</span>
                    </div>
                  )}

                  {activity.jobId && (
                    <div>
                      <span className="text-gray-600">Job: </span>
                      <Link
                        href={`/admin/jobs/${activity.jobId}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                      >
                        {activity.jobId.substring(0, 8)}...
                      </Link>
                    </div>
                  )}

                  {activity.adImageId && (
                    <div>
                      <span className="text-gray-600">Image: </span>
                      <Link
                        href={`/admin/ad-images/${activity.adImageId}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                      >
                        {activity.adImageId.substring(0, 8)}...
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AdminCard>
  );
}

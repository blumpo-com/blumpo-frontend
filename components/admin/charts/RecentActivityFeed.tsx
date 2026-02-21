'use client';

import Link from 'next/link';
import { AdminCard } from '../AdminCard';
import { User, Briefcase, AlertTriangle } from 'lucide-react';

interface RecentActivityItem {
  type: 'user' | 'job' | 'error';
  description: string;
  timestamp: Date | string;
  link?: string;
}

interface RecentActivityFeedProps {
  data: RecentActivityItem[];
  isLoading?: boolean;
}

function getActivityIcon(type: string) {
  switch (type) {
    case 'user':
      return <User className="w-4 h-4" />;
    case 'job':
      return <Briefcase className="w-4 h-4" />;
    case 'error':
      return <AlertTriangle className="w-4 h-4" />;
    default:
      return null;
  }
}

function getActivityColor(type: string) {
  switch (type) {
    case 'user':
      return 'text-blue-600';
    case 'job':
      return 'text-green-600';
    case 'error':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
}

export function RecentActivityFeed({ data, isLoading }: RecentActivityFeedProps) {
  if (isLoading) {
    return (
      <AdminCard title="Recent Activity">
        <div className="h-64 flex items-center justify-center text-gray-500">
          Loading...
        </div>
      </AdminCard>
    );
  }

  if (!data || data.length === 0) {
    return (
      <AdminCard title="Recent Activity">
        <div className="h-64 flex items-center justify-center text-gray-500">
          No recent activity
        </div>
      </AdminCard>
    );
  }

  const formatTimestamp = (timestamp: Date | string) => {
    try {
      const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
      if (isNaN(date.getTime())) {
        return 'Unknown';
      }
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  };

  const content = (
    <div className="space-y-3">
      {data.map((item, index) => {
        const icon = getActivityIcon(item.type);
        const color = getActivityColor(item.type);
        const timestamp = formatTimestamp(item.timestamp);

        const activityContent = (
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 ${color}`}>{icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 truncate">{item.description}</p>
              <p className="text-xs text-gray-500 mt-1">{timestamp}</p>
            </div>
          </div>
        );

        if (item.link) {
          return (
            <Link
              key={index}
              href={item.link}
              className="block p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {activityContent}
            </Link>
          );
        }

        return (
          <div key={index} className="p-2 rounded-lg">
            {activityContent}
          </div>
        );
      })}
    </div>
  );

  return <AdminCard title="Recent Activity">{content}</AdminCard>;
}

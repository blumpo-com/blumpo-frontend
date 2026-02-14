import Link from 'next/link';
import { ReactNode } from 'react';

interface EntityLinkProps {
  type: 'user' | 'brand' | 'job' | 'ad-image' | 'error';
  id: string;
  label: string;
  metadata?: string;
  href?: string;
}

const typeConfig = {
  user: {
    icon: '👤',
    basePath: '/admin/users',
  },
  brand: {
    icon: '🏢',
    basePath: '/admin/brands',
  },
  job: {
    icon: '⚙️',
    basePath: '/admin/jobs',
  },
  'ad-image': {
    icon: '🖼️',
    basePath: '/admin/ad-images',
  },
  error: {
    icon: '⚠️',
    basePath: '/admin/workflow-errors',
  },
};

export function EntityLink({ type, id, label, metadata, href }: EntityLinkProps) {
  const config = typeConfig[type];
  const linkHref = href || `${config.basePath}/${id}`;

  return (
    <Link
      href={linkHref}
      className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors group"
    >
      <span className="text-lg">{config.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 group-hover:text-blue-700 truncate">
          {label}
        </div>
        {metadata && (
          <div className="text-sm text-gray-500 truncate">{metadata}</div>
        )}
      </div>
      <span className="text-gray-400 group-hover:text-blue-500">→</span>
    </Link>
  );
}

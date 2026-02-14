import Link from 'next/link';
import { AdminCard } from './AdminCard';
import { EntityLink } from './EntityLink';

export interface RelatedEntity {
  id: string;
  label: string;
  href?: string;
  metadata?: string;
  type: 'user' | 'brand' | 'job' | 'ad-image' | 'error';
}

interface RelatedEntitiesSectionProps {
  title: string;
  entities: RelatedEntity[];
  viewAllHref?: string;
  emptyMessage?: string;
  limit?: number;
}

export function RelatedEntitiesSection({
  title,
  entities,
  viewAllHref,
  emptyMessage = 'No related entities found.',
  limit = 10,
}: RelatedEntitiesSectionProps) {
  const displayEntities = entities.slice(0, limit);
  const hasMore = entities.length > limit;

  if (entities.length === 0) {
    return (
      <AdminCard>
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <p className="text-gray-500 text-sm">{emptyMessage}</p>
      </AdminCard>
    );
  }

  return (
    <AdminCard>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          {title}
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({entities.length})
          </span>
        </h3>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View All →
          </Link>
        )}
      </div>
      <div className="space-y-2">
        {displayEntities.map((entity) => (
          <EntityLink
            key={entity.id}
            type={entity.type}
            id={entity.id}
            label={entity.label}
            metadata={entity.metadata}
            href={entity.href}
          />
        ))}
        {hasMore && !viewAllHref && (
          <div className="text-sm text-gray-500 text-center pt-2">
            ... and {entities.length - limit} more
          </div>
        )}
      </div>
    </AdminCard>
  );
}

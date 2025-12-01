import { pgTable, bigserial, timestamp, text, jsonb, uuid, index } from 'drizzle-orm/pg-core';
import { user } from './user';
import { brand } from './brand';
import { generationJob } from './generation';
import { adImage } from './adImage';
import { adArchetype } from './adArchetype';
import { adWorkflow } from './adWorkflow';

// Ad event table (analytics)
export const adEvent = pgTable('ad_event', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  userId: uuid('user_id').references(() => user.id, { onDelete: 'cascade' }),
  brandId: uuid('brand_id').references(() => brand.id, { onDelete: 'set null' }),
  jobId: uuid('job_id').references(() => generationJob.id, { onDelete: 'cascade' }),
  adImageId: uuid('ad_image_id').references(() => adImage.id, { onDelete: 'cascade' }),
  archetypeCode: text('archetype_code').references(() => adArchetype.code, { onDelete: 'set null' }),
  workflowId: uuid('workflow_id').references(() => adWorkflow.id, { onDelete: 'set null' }),
  eventType: text('event_type').notNull(), // 'saved', 'deleted', 'restored', 'downloaded', 'shared', 'auto_delete'
  eventSource: text('event_source'), // 'ui', 'api', 'cron_cleanup', etc.
  metadata: jsonb('metadata').notNull().default({}),
}, (table) => ({
  adImageIdx: index('idx_ad_event_ad_image').on(table.adImageId),
  jobIdx: index('idx_ad_event_job').on(table.jobId),
  brandIdx: index('idx_ad_event_brand').on(table.brandId),
  userIdx: index('idx_ad_event_user').on(table.userId),
  typeTimeIdx: index('idx_ad_event_type_time').on(table.eventType, table.createdAt.desc()),
}));

// Relations will be defined in index.ts to avoid circular dependencies

// Types
export type AdEvent = typeof adEvent.$inferSelect;
export type NewAdEvent = typeof adEvent.$inferInsert;


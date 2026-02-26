import { pgTable, uuid, timestamp, text, bigint, integer, boolean, index } from 'drizzle-orm/pg-core';
import { generationJob } from './generation';
import { user } from './user';
import { brand } from './brand';
import { adWorkflow } from './adWorkflow';

// Ad image table (replaces asset_image)
export const adImage = pgTable('ad_image', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').notNull().references(() => generationJob.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  brandId: uuid('brand_id').references(() => brand.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),

  title: text('title'),
  storageKey: text('storage_key').notNull(),
  publicUrl: text('public_url'),
  bytesSize: bigint('bytes_size', { mode: 'number' }).notNull(),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  format: text('format').notNull(),

  workflowId: uuid('workflow_id').references(() => adWorkflow.id, { onDelete: 'set null' }),
  banFlag: boolean('ban_flag').notNull().default(false),
  errorFlag: boolean('error_flag').notNull().default(false),
  errorMessage: text('error_message'),
  isDeleted: boolean('is_deleted').notNull().default(false),
  deleteAt: timestamp('delete_at', { withTimezone: true }),
  permanentlyDeleted: boolean('permanently_deleted').notNull().default(false),
  readyToDisplay: boolean('ready_to_display').notNull().default(true), // Flag for quick ads - determines if ad is ready to display
}, (table) => ({
  userTimeIdx: index('idx_ad_image_user_time').on(table.userId, table.createdAt.desc()),
  jobIdx: index('idx_ad_image_job').on(table.jobId),
  brandIdx: index('idx_ad_image_brand').on(table.brandId),
  workflowIdx: index('idx_ad_image_workflow').on(table.workflowId),
}));

// Relations will be defined in index.ts to avoid circular dependencies

// Types
export type AdImage = typeof adImage.$inferSelect;
export type NewAdImage = typeof adImage.$inferInsert;


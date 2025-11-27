import { pgTable, uuid, timestamp, text, jsonb, bigint, integer, boolean, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { user } from './user';
import { generationJob } from './generation';

// Images (main asset)
export const assetImage = pgTable('asset_image', {
  id: uuid('id').primaryKey(),
  jobId: uuid('job_id').notNull().references(() => generationJob.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),

  title: text('title'),
  description: text('description'),

  storageKey: text('storage_key').notNull(), // e.g., s3: "users/{uid}/jobs/{jobId}/{imageId}.webp"
  publicUrl: text('public_url'), // if public/cdn
  mimeType: text('mime_type').notNull(), // image/webp, image/png...
  bytesSize: bigint('bytes_size', { mode: 'number' }).notNull(),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  format: text('format').notNull(), // WEBP/PNG/JPEG (optional enum)
  sha256: text('sha256'),
  safetyFlags: jsonb('safety_flags').notNull().default([]),

  isDeleted: boolean('is_deleted').notNull().default(false),
}, (table) => ({
  userTimeIdx: index('idx_asset_image_user_time').on(table.userId, table.createdAt.desc()),
  jobIdx: index('idx_asset_image_job').on(table.jobId),
}));



// Relations
export const assetImageRelations = relations(assetImage, ({ one }) => ({
  user: one(user, {
    fields: [assetImage.userId],
    references: [user.id],
  }),
  generationJob: one(generationJob, {
    fields: [assetImage.jobId],
    references: [generationJob.id],
  }),
}));

// Types
export type AssetImage = typeof assetImage.$inferSelect;
export type NewAssetImage = typeof assetImage.$inferInsert;
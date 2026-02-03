import { pgTable, uuid, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { adWorkflow } from './adWorkflow';

export const adClone = pgTable(
  'ad_clone',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workflowId: uuid('workflow_id')
      .notNull()
      .references(() => adWorkflow.id, { onDelete: 'cascade' }),
    storageKey: text('storage_key').notNull(),
    storageUrl: text('storage_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    workflowIdUnique: uniqueIndex('ad_clone_workflow_id_unique').on(table.workflowId),
  })
);

export type AdClone = typeof adClone.$inferSelect;
export type NewAdClone = typeof adClone.$inferInsert;

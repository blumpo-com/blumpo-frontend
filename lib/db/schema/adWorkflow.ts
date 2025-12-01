import { pgTable, uuid, text, boolean, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { adArchetype } from './adArchetype';

// Ad workflow table
export const adWorkflow = pgTable('ad_workflow', {
  id: uuid('id').primaryKey().defaultRandom(),
  archetypeCode: text('archetype_code').notNull().references(() => adArchetype.code, { onDelete: 'restrict' }),
  workflowUid: text('workflow_uid').notNull(),
  variantKey: text('variant_key').notNull(),
  format: text('format'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  archetypeIdx: index('idx_ad_workflow_archetype').on(table.archetypeCode),
  workflowUidIdx: index('idx_ad_workflow_uid').on(table.workflowUid),
  uniqueVariant: uniqueIndex('ad_workflow_unique_variant').on(table.archetypeCode, table.variantKey),
}));

// Relations will be defined in index.ts to avoid circular dependencies

// Types
export type AdWorkflow = typeof adWorkflow.$inferSelect;
export type NewAdWorkflow = typeof adWorkflow.$inferInsert;


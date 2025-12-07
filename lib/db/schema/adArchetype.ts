import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

// Ad archetype table
export const adArchetype = pgTable('ad_archetype', {
  code: text('code').primaryKey(),
  displayName: text('display_name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Relations will be defined in index.ts to avoid circular dependencies

// Types
export type AdArchetype = typeof adArchetype.$inferSelect;
export type NewAdArchetype = typeof adArchetype.$inferInsert;


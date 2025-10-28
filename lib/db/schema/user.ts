import { pgTable, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const user = pgTable('user', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull().unique(), // Using CITEXT in PostgreSQL
  displayName: text('display_name').notNull(),
  photoUrl: text('photo_url'),
  phoneNumber: text('phone_number'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  banFlag: boolean('ban_flag').notNull().default(false),
});

// Relations - will be defined after all tables are created
// export const userRelations = relations(user, ({ one, many }) => ({
//   tokenAccount: one(tokenAccount),
//   tokenLedgerEntries: many(tokenLedger),
//   generationJobs: many(generationJob),
//   assetImages: many(assetImage),
//   authOtps: many(authOtp),
// }));

// Types
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
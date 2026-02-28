import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { user } from './user';

export const newsletterSubscription = pgTable('newsletter_subscription', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  userId: uuid('user_id').references(() => user.id, { onDelete: 'set null' }),
  subscribedAt: timestamp('subscribed_at', { withTimezone: true }).notNull().defaultNow(),
  confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
});

export type NewsletterSubscription = typeof newsletterSubscription.$inferSelect;
export type NewNewsletterSubscription = typeof newsletterSubscription.$inferInsert;

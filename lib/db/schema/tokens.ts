import { pgTable, uuid, bigint, text, timestamp, bigserial, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { subscriptionPeriodEnum } from './enums';
import { user } from './user';
import { subscriptionPlan } from './subscription';

// Token account table (1:1 with user)
export const tokenAccount = pgTable('token_account', {
  userId: uuid('user_id').primaryKey().references(() => user.id, { onDelete: 'cascade' }),
  balance: bigint('balance', { mode: 'number' }).notNull().default(0),
  planCode: text('plan_code').notNull().default('FREE').references(() => subscriptionPlan.planCode, { onUpdate: 'cascade', onDelete: 'restrict' }),
  period: subscriptionPeriodEnum('period').notNull().default('MONTHLY'),
  lastRefillAt: timestamp('last_refill_at', { withTimezone: true }),
  nextRefillAt: timestamp('next_refill_at', { withTimezone: true }),
  // Stripe-related columns
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  stripeProductId: text('stripe_product_id'),
  stripePriceId: text('stripe_price_id'),
  subscriptionStatus: text('subscription_status'),
  // When subscription is cancelled but user still has access until end of billing period
  cancellationTime: timestamp('cancellation_time', { withTimezone: true }),
}, (table) => ({
  stripeCustomerIdx: uniqueIndex('uq_token_account_stripe_customer')
    .on(table.stripeCustomerId)
    .where(sql`stripe_customer_id IS NOT NULL`),
  stripeSubscriptionIdx: uniqueIndex('uq_token_account_stripe_subscription')
    .on(table.stripeSubscriptionId)
    .where(sql`stripe_subscription_id IS NOT NULL`),
}));

// Token ledger table (auditing/accounting)
export const tokenLedger = pgTable('token_ledger', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  userId: uuid('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
  delta: bigint('delta', { mode: 'number' }).notNull(),
  reason: text('reason').notNull(), // 'GENERATION','MONTHLY_REFILL','PURCHASE','ADMIN_ADJUST',...
  referenceId: text('reference_id'), // e.g. job_id or order_id (for idempotency)
  balanceAfter: bigint('balance_after', { mode: 'number' }).notNull(),
}, (table) => ({
  userTimeIdx: index('idx_token_ledger_user_time').on(table.userId, table.occurredAt.desc()),
  reasonRefIdx: uniqueIndex('uq_token_ledger_reason_ref').on(table.reason, table.referenceId).where(sql`reference_id IS NOT NULL`),
}));

// Note: Indexes are defined in the table callback above.

// Relations
export const tokenAccountRelations = relations(tokenAccount, ({ one }) => ({
  user: one(user, {
    fields: [tokenAccount.userId],
    references: [user.id],
  }),
  subscriptionPlan: one(subscriptionPlan, {
    fields: [tokenAccount.planCode],
    references: [subscriptionPlan.planCode],
  }),
}));

export const tokenLedgerRelations = relations(tokenLedger, ({ one }) => ({
  user: one(user, {
    fields: [tokenLedger.userId],
    references: [user.id],
  }),
  // generationJob relation will be defined in index.ts after all tables are created
}));

// Types
export type TokenAccount = typeof tokenAccount.$inferSelect;
export type NewTokenAccount = typeof tokenAccount.$inferInsert;
export type TokenLedger = typeof tokenLedger.$inferSelect;
export type NewTokenLedger = typeof tokenLedger.$inferInsert;
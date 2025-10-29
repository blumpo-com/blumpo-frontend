import { pgTable, text, bigint, boolean, integer, timestamp, index, uniqueIndex, jsonb, bigserial } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// Subscription plan table
export const subscriptionPlan = pgTable('subscription_plan', {
  planCode: text('plan_code').primaryKey(),
  displayName: text('display_name').notNull(),
  monthlyTokens: bigint('monthly_tokens', { mode: 'number' }).notNull().$default(() => 0),
  stripeProductId: text('stripe_product_id').unique(),
  isActive: boolean('is_active').notNull().default(true),
  isDefault: boolean('is_default').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(100),
  rolloverCap: bigint('rollover_cap', { mode: 'number' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  singleDefaultIdx: uniqueIndex('uq_subscription_plan_single_default')
    .on(table.isDefault)
    .where(sql`is_default = true`),
  activeSortIdx: index('idx_subscription_plan_active_sort')
    .on(table.isActive, table.sortOrder),
}));

// Top-up plan table
export const topupPlan = pgTable('topup_plan', {
  topupSku: text('topup_sku').primaryKey(),
  displayName: text('display_name').notNull(),
  tokensAmount: bigint('tokens_amount', { mode: 'number' }).notNull(),
  stripeProductId: text('stripe_product_id').unique(),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(100),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  activeSortIdx: index('idx_topup_plan_active_sort')
    .on(table.isActive, table.sortOrder),
}));

// Generation pricing table
export const generationPricing = pgTable('generation_pricing', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  name: text('name').notNull(),
  strategy: text('strategy').notNull().default('STATIC'),
  baseCostTokens: bigint('base_cost_tokens', { mode: 'number' }).notNull().$default(() => 0),
  rules: jsonb('rules').notNull().default('{}'),
  isActive: boolean('is_active').notNull().default(true),
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  singleActiveIdx: uniqueIndex('uq_generation_pricing_single_active')
    .on(table.isActive)
    .where(sql`is_active = true`),
}));

// Types
export type SubscriptionPlan = typeof subscriptionPlan.$inferSelect;
export type NewSubscriptionPlan = typeof subscriptionPlan.$inferInsert;
export type TopupPlan = typeof topupPlan.$inferSelect;
export type NewTopupPlan = typeof topupPlan.$inferInsert;
export type GenerationPricing = typeof generationPricing.$inferSelect;
export type NewGenerationPricing = typeof generationPricing.$inferInsert;
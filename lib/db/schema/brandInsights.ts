import { pgTable, uuid, timestamp, text, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { brand } from './brand';

// Brand insights table (1:1 with brand)
export const brandInsights = pgTable('brand_insights', {
  brandId: uuid('brand_id').primaryKey().references(() => brand.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),

  // Preferences
  clientAdPreferences: jsonb('client_ad_preferences').notNull().default({}),

  // Brand & customer insights
  industry: text('industry'),
  customerPainPoints: text('customer_pain_points').array().notNull().default([]),
  productDescription: text('product_description'),
  keyFeatures: text('key_features').array().notNull().default([]),
  brandVoice: text('brand_voice'),
  uniqueValueProp: text('unique_value_prop'),
  expectedCustomer: text('expected_customer'),
  targetCustomer: text('target_customer'),
  keyBenefits: text('key_benefits').array().notNull().default([]),
  competitors: text('competitors').array().notNull().default([]),

  // LLM-based insights
  insTriggerEvents: text('ins_trigger_events').array().notNull().default([]),
  insAspirations: text('ins_aspirations').array().notNull().default([]),
  insInterestingQuotes: text('ins_interesting_quotes').array().notNull().default([]),
  insMarketingInsight: text('ins_marketing_insight'),
  insTrendOpportunity: text('ins_trend_opportunity'),
  insRaw: jsonb('ins_raw').notNull().default([]),

  // Marketing brief summarised from web
  marketingBrief: text('marketing_brief'),

  // Reddit research insights
  redditCustomerDesires: jsonb('reddit_customer_desires').default([]),
  redditCustomerPainPoints: jsonb('reddit_customer_pain_points').default([]),
  redditInterestingQuotes: jsonb('reddit_interesting_quotes').default([]),
  redditPurchaseTriggers: jsonb('reddit_purchase_triggers').default([]),
  redditMarketingBrief: text('reddit_marketing_brief'),
});

// Relations
export const brandInsightsRelations = relations(brandInsights, ({ one }) => ({
  brand: one(brand, {
    fields: [brandInsights.brandId],
    references: [brand.id],
  }),
}));

// Types
export type BrandInsights = typeof brandInsights.$inferSelect;
export type NewBrandInsights = typeof brandInsights.$inferInsert;


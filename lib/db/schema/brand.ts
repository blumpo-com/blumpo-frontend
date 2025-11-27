import { pgTable, uuid, timestamp, text, boolean, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { user } from './user';

// Brand table (merged brand + brand_insights)
export const brand = pgTable('brand', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  isDeleted: boolean('is_deleted').notNull().default(false),

  // Core brand data
  name: text('name').notNull(),
  websiteUrl: text('website_url').notNull(),

  // Brand assets
  language: text('language').notNull().default('en'),
  fonts: jsonb('fonts').notNull().default([]),
  colors: text('colors').array().notNull(),
  photos: text('photos').array().notNull(),
  heroPhotos: text('hero_photos').array().notNull(),
  logoUrl: text('logo_url'),

  // Preferences
  clientAdPreferences: jsonb('client_ad_preferences').notNull().default({}),

  // Brand & customer insights
  industry: text('industry'),
  customerPainPoints: text('customer_pain_points').array(),
  productDescription: text('product_description'),
  keyFeatures: text('key_features').array(),
  brandVoice: text('brand_voice'),
  uniqueValueProp: text('unique_value_prop'),
  expectedCustomer: text('expected_customer'),
  targetCustomer: text('target_customer'),
  keyBenefits: text('key_benefits').array(),
  competitors: text('competitors').array(),

  // Insights
  insTriggerEvents: text('ins_trigger_events').array(),
  insAspirations: text('ins_aspirations').array(),
  insInterestingQuotes: text('ins_interesting_quotes').array(),
  insMarketingInsight: text('ins_marketing_insight'),
  insTrendOpportunity: text('ins_trend_opportunity'),
  insRaw: jsonb('ins_raw').default([]),
}, (table) => ({
  userIdx: index('idx_brand_user').on(table.userId),
  userWebsiteUnique: uniqueIndex('brand_user_website_unique').on(table.userId, table.websiteUrl),
}));

// Relations
export const brandRelations = relations(brand, ({ one }) => ({
  user: one(user, {
    fields: [brand.userId],
    references: [user.id],
  }),
}));

// Types
export type Brand = typeof brand.$inferSelect;
export type NewBrand = typeof brand.$inferInsert;


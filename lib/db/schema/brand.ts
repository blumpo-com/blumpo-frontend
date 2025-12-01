import { pgTable, uuid, timestamp, text, boolean, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { user } from './user';

// Brand table (core stable data + assets)
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

  // Link to stored website raw data (HTML / scraped bundle)
  websiteDataUrl: text('website_data_url'),
}, (table) => ({
  userIdx: index('idx_brand_user').on(table.userId),
  userWebsiteUnique: uniqueIndex('brand_user_website_unique').on(table.userId, table.websiteUrl),
}));

// Relations (insights relation defined in index.ts to avoid circular dependency)
export const brandRelations = relations(brand, ({ one }) => ({
  user: one(user, {
    fields: [brand.userId],
    references: [user.id],
  }),
}));

// Types
export type Brand = typeof brand.$inferSelect;
export type NewBrand = typeof brand.$inferInsert;


import { pgTable, uuid, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { brand } from './brand';

export const brandExtractionStatus = pgTable('brand_extraction_status', {
  id: uuid('id').primaryKey().defaultRandom(),
  brandId: uuid('brand_id')
    .notNull()
    .references(() => brand.id, { onDelete: 'cascade' }),

  colorsStatus: text('colors_status').default('pending'),
  colorsError: text('colors_error'),

  fontsStatus: text('fonts_status').default('pending'),
  fontsError: text('fonts_error'),

  logoStatus: text('logo_status').default('pending'),
  logoError: text('logo_error'),

  heroStatus: text('hero_status').default('pending'),
  heroError: text('hero_error'),

  insightsStatus: text('insights_status').default('pending'),
  insightsError: text('insights_error'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  uniqueBrandIdx: uniqueIndex('brand_extraction_status_brand_id_unique').on(table.brandId),
}));

export const brandExtractionStatusRelations = relations(brandExtractionStatus, ({ one }) => ({
  brand: one(brand, {
    fields: [brandExtractionStatus.brandId],
    references: [brand.id],
  }),
}));

export type BrandExtractionStatus = typeof brandExtractionStatus.$inferSelect;
export type NewBrandExtractionStatus = typeof brandExtractionStatus.$inferInsert;


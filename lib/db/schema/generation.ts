import { pgTable, uuid, timestamp, text, jsonb, bigint, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { jobStatusEnum } from './enums';
import { user } from './user';
import { tokenLedger } from './tokens';
import { brand } from './brand';
import { adArchetype } from './adArchetype';
// Note: adImage import removed to avoid circular dependency - FK constraint defined in migration

// Generation jobs table (links token usage to assets)
export const generationJob = pgTable('generation_job', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  status: jobStatusEnum('status').notNull().default('QUEUED'),

  prompt: text('prompt'), // Now nullable
  params: jsonb('params').notNull().default({}), // width,height,steps,cfg,seed,...

  tokensCost: bigint('tokens_cost', { mode: 'number' }).notNull().default(0),
  ledgerId: bigint('ledger_id', { mode: 'number' }).unique().references(() => tokenLedger.id, { onDelete: 'set null' }),
  errorCode: text('error_code'),
  errorMessage: text('error_message'),

  // Brand and generation parameters
  brandId: uuid('brand_id').references(() => brand.id, { onDelete: 'set null' }),
  
  // Product photos
  productPhotoUrls: text('product_photo_urls').array().notNull().default([]), // Array of photo URLs
  productPhotoMode: text('product_photo_mode').notNull().default('brand'), // 'brand' | 'custom' | 'mixed'
  
  // Archetype config
  archetypeCode: text('archetype_code').references(() => adArchetype.code, { onDelete: 'set null' }),
  archetypeMode: text('archetype_mode').notNull().default('single'), // 'single' | 'random'
  
  // Format support
  formats: text('formats').array().notNull().default([]), // Array of formats (e.g., ['square', 'story'])
  format: text('format'), // Legacy single format (nullable)
  
  // Selected insights
  selectedPainPoints: text('selected_pain_points').array().notNull().default([]), // Array of selected pain points
  insightSource: text('insight_source').notNull().default('auto'), // 'auto' | 'manual' | 'mixed'
  
  archetypeInputs: jsonb('archetype_inputs').notNull().default({}),
}, (table) => ({
  userTimeIdx: index('idx_generation_job_user_time').on(table.userId, table.createdAt.desc()),
  statusIdx: index('idx_generation_job_status').on(table.status),
}));

// Relations (complete relations will be defined in index.ts to avoid circular dependencies)
export const generationJobRelations = relations(generationJob, ({ one, many }) => ({
  user: one(user, {
    fields: [generationJob.userId],
    references: [user.id],
  }),
  ledgerEntry: one(tokenLedger, {
    fields: [generationJob.ledgerId],
    references: [tokenLedger.id],
  }),
  brand: one(brand, {
    fields: [generationJob.brandId],
    references: [brand.id],
  }),
  archetype: one(adArchetype, {
    fields: [generationJob.archetypeCode],
    references: [adArchetype.code],
    relationName: 'archetypeJobs',
  }),
  // adImages relations will be defined in index.ts to avoid circular dependency
}));

// Types
export type GenerationJob = typeof generationJob.$inferSelect;
export type NewGenerationJob = typeof generationJob.$inferInsert;
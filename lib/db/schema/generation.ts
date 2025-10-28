import { pgTable, uuid, timestamp, text, jsonb, bigint, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { jobStatusEnum } from './enums';
import { user } from './user';
import { tokenLedger } from './tokens';

// Generation jobs table (links token usage to assets)
export const generationJob = pgTable('generation_job', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  status: jobStatusEnum('status').notNull().default('QUEUED'),

  prompt: text('prompt').notNull(),
  params: jsonb('params').notNull().default({}), // width,height,steps,cfg,seed,...

  tokensCost: bigint('tokens_cost', { mode: 'number' }).notNull().default(0),
  ledgerId: bigint('ledger_id', { mode: 'number' }).unique().references(() => tokenLedger.id, { onDelete: 'set null' }),
  errorCode: text('error_code'),
  errorMessage: text('error_message'),
}, (table) => ({
  userTimeIdx: index('idx_generation_job_user_time').on(table.userId, table.createdAt.desc()),
  statusIdx: index('idx_generation_job_status').on(table.status),
}));

// Relations
export const generationJobRelations = relations(generationJob, ({ one, many }) => ({
  user: one(user, {
    fields: [generationJob.userId],
    references: [user.id],
  }),
  ledgerEntry: one(tokenLedger, {
    fields: [generationJob.ledgerId],
    references: [tokenLedger.id],
  }),
  // assetImages relation will be defined in index.ts after all tables are created
}));

// Types
export type GenerationJob = typeof generationJob.$inferSelect;
export type NewGenerationJob = typeof generationJob.$inferInsert;
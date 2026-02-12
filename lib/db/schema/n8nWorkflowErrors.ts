import { pgTable, bigserial, bigint, text, integer, timestamp, boolean, index, unique } from 'drizzle-orm/pg-core';

// n8n workflow errors table (aggregated error "bucket")
export const n8nWorkflowErrors = pgTable('n8n_workflow_errors', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  workflowId: text('workflow_id').notNull(),
  workflowName: text('workflow_name'),
  nodeId: text('node_id').notNull(),
  nodeName: text('node_name'),
  nodeType: text('node_type'),
  nodeTypeVersion: integer('node_type_version'),
  errorName: text('error_name'), // e.g., NodeOperationError
  errorLevel: text('error_level'), // warning/error
  errorMessage: text('error_message').notNull(),
  errorFingerprint: text('error_fingerprint').notNull(),
  occurrencesCount: integer('occurrences_count').notNull().default(1),
  firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).notNull(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull(),
  lastExecutionId: text('last_execution_id'),
  lastExecutionUrl: text('last_execution_url'),
  lastNodeExecuted: text('last_node_executed'),
  sampleStack: text('sample_stack'),
  isResolved: boolean('is_resolved').notNull().default(false),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  resolvedBy: text('resolved_by'),
  resolutionNote: text('resolution_note'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  workflowIdIdx: index('idx_n8n_workflow_errors_workflow_id').on(table.workflowId),
  nodeIdIdx: index('idx_n8n_workflow_errors_node_id').on(table.nodeId),
  resolvedTimeIdx: index('idx_n8n_workflow_errors_resolved_time').on(table.isResolved, table.lastSeenAt.desc()),
  errorLevelTimeIdx: index('idx_n8n_workflow_errors_level_time').on(table.errorLevel, table.lastSeenAt.desc()),
  errorFingerprintUnique: unique('uq_n8n_workflow_errors_fingerprint').on(table.errorFingerprint),
}));

// n8n workflow error occurrences table (individual occurrences)
export const n8nWorkflowErrorOccurrences = pgTable('n8n_workflow_error_occurrences', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  errorId: bigint('error_id', { mode: 'number' }).notNull().references(() => n8nWorkflowErrors.id, { onDelete: 'cascade' }),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
  executionId: text('execution_id'),
  executionUrl: text('execution_url'),
  mode: text('mode'),
  source: text('source'),
  stack: text('stack'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  errorIdTimeIdx: index('idx_n8n_workflow_error_occurrences_error_time').on(table.errorId, table.occurredAt.desc()),
  occurredAtIdx: index('idx_n8n_workflow_error_occurrences_occurred_at').on(table.occurredAt.desc()),
}));

// Types
export type N8nWorkflowError = typeof n8nWorkflowErrors.$inferSelect;
export type NewN8nWorkflowError = typeof n8nWorkflowErrors.$inferInsert;
export type N8nWorkflowErrorOccurrence = typeof n8nWorkflowErrorOccurrences.$inferSelect;
export type NewN8nWorkflowErrorOccurrence = typeof n8nWorkflowErrorOccurrences.$inferInsert;

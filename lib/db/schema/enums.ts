import { pgEnum } from 'drizzle-orm/pg-core';

// PostgreSQL enums
export const tokenPeriodEnum = pgEnum('token_period', ['DAY', 'WEEK', 'MONTH']);
export const jobStatusEnum = pgEnum('job_status', ['QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELED']);
export const variantKindEnum = pgEnum('variant_kind', ['ORIGINAL', 'THUMB', 'WEB', 'PRINT']);

// TypeScript enums mirroring DB enums
export enum TokenPeriod {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
}

export enum JobStatus {
  QUEUED = 'QUEUED',
  RUNNING = 'RUNNING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
}

export enum VariantKind {
  ORIGINAL = 'ORIGINAL',
  THUMB = 'THUMB',
  WEB = 'WEB',
  PRINT = 'PRINT',
}
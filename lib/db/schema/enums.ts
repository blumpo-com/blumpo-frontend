import { pgEnum } from 'drizzle-orm/pg-core';

// PostgreSQL enums
export const tokenPeriodEnum = pgEnum('token_period', ['DAY', 'WEEK', 'MONTH']);
export const jobStatusEnum = pgEnum('job_status', ['QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELED']);

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


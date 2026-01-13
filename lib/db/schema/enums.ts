import { pgEnum } from 'drizzle-orm/pg-core';

// PostgreSQL enums
export const subscriptionPeriodEnum = pgEnum('subscription_period', ['MONTHLY', 'YEARLY']);
export const jobStatusEnum = pgEnum('job_status', ['QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELED']);

// TypeScript enums mirroring DB enums
export enum SubscriptionPeriod {
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

export enum JobStatus {
  QUEUED = 'QUEUED',
  RUNNING = 'RUNNING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
}


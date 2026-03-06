import { pgEnum } from 'drizzle-orm/pg-core';

// PostgreSQL enums
export const subscriptionPeriodEnum = pgEnum('subscription_period', ['MONTHLY', 'YEARLY']);
export const jobStatusEnum = pgEnum('job_status', ['QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELED']);
export const userRoleEnum = pgEnum('user_role', ['USER', 'ADMIN']);
export const businessTypeEnum = pgEnum('business_type', [
  'B2B SaaS',
  'B2C/B2B Services',
  'D2C/Ecommerce',
  'Retail/Distribution',
]);

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

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum BusinessType {
  B2B_SAAS = 'B2B SaaS',
  B2C_B2B_SERVICES = 'B2C/B2B Services',
  D2C_ECOMMERCE = 'D2C/Ecommerce',
  RETAIL_DISTRIBUTION = 'Retail/Distribution',
}


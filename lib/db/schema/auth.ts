import { pgTable, uuid, text, timestamp, integer, inet, index } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { user } from './user';

// One-time challenges (OTP via e-mail)
export const authOtp = pgTable('auth_otp', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull(), // login by e-mail (CITEXT in PostgreSQL)
  userId: uuid('user_id').references(() => user.id, { onDelete: 'set null' }),
  codeHash: text('code_hash').notNull(), // hash of 6-digit PIN (e.g., scrypt/argon2)
  purpose: text('purpose').notNull().default('LOGIN'), // LOGIN / VERIFY_EMAIL / CHANGE_EMAIL...
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(), // e.g., NOW() + INTERVAL '10 minutes'
  consumedAt: timestamp('consumed_at', { withTimezone: true }), // after successful use
  attempts: integer('attempts').notNull().default(0), // attempt counter
  maxAttempts: integer('max_attempts').notNull().default(5),
  resendCount: integer('resend_count').notNull().default(0),
  ipAddress: inet('ip_address'), // optional (rate-limit/abuse analysis)
  userAgent: text('user_agent'), // optional
}, (table) => ({
  emailActiveIdx: index('idx_auth_otp_email_active').on(table.email).where(sql`consumed_at IS NULL`),
}));

// Relations
export const authOtpRelations = relations(authOtp, ({ one }) => ({
  user: one(user, {
    fields: [authOtp.userId],
    references: [user.id],
  }),
}));

// Types
export type AuthOtp = typeof authOtp.$inferSelect;
export type NewAuthOtp = typeof authOtp.$inferInsert;
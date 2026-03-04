import { pgTable, uuid, bigserial, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tokenAccount } from './tokens';

export const tokenAccountPromotion = pgTable(
  'token_account_promotion',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    tokenAccountId: uuid('token_account_id')
      .notNull()
      .references(() => tokenAccount.userId, { onDelete: 'cascade' }),
    promotionKey: text('promotion_key').notNull(),
    stripePromotionCodeId: text('stripe_promotion_code_id'),
    stripeCouponId: text('stripe_coupon_id'),
    status: text('status').notNull(), // inactive | available | active | used | expired | revoked
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    startedAt: timestamp('started_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tokenAccountPromotionKeyUnique: uniqueIndex('uq_token_account_promotion_account_key').on(
      table.tokenAccountId,
      table.promotionKey
    ),
  })
);

export const tokenAccountPromotionRelations = relations(tokenAccountPromotion, ({ one }) => ({
  tokenAccount: one(tokenAccount, {
    fields: [tokenAccountPromotion.tokenAccountId],
    references: [tokenAccount.userId],
  }),
}));

export type TokenAccountPromotion = typeof tokenAccountPromotion.$inferSelect;
export type NewTokenAccountPromotion = typeof tokenAccountPromotion.$inferInsert;

import { relations } from 'drizzle-orm';

// Export all enums
export * from './enums';

// Export all tables
export { user } from './user';
export { tokenAccount, tokenLedger } from './tokens';
export { generationJob } from './generation';
export { assetImage } from './assets';
export { authOtp } from './auth';
export { brand } from './brand';
export { brandExtractionStatus } from './brandExtractionStatus';
export { subscriptionPlan, topupPlan, generationPricing } from './subscription';

// Export individual relations
export { tokenAccountRelations, tokenLedgerRelations } from './tokens';
export { generationJobRelations } from './generation';
export { assetImageRelations } from './assets';
export { authOtpRelations } from './auth';
export { brandRelations } from './brand';
export { brandExtractionStatusRelations } from './brandExtractionStatus';

// Import tables for cross-relations
import { user } from './user';
import { tokenAccount, tokenLedger } from './tokens';
import { generationJob } from './generation';
import { assetImage } from './assets';
import { authOtp } from './auth';
import { brand } from './brand';
import { brandExtractionStatus } from './brandExtractionStatus';
import { subscriptionPlan, topupPlan, generationPricing } from './subscription';

// Define user relations now that all tables are available
export const userRelations = relations(user, ({ one, many }) => ({
  tokenAccount: one(tokenAccount, {
    fields: [user.id],
    references: [tokenAccount.userId],
  }),
  tokenLedgerEntries: many(tokenLedger),
  generationJobs: many(generationJob),
  assetImages: many(assetImage),
  authOtps: many(authOtp),
  brands: many(brand),
}));

// Complete generation job relations
export const generationJobCompleteRelations = relations(generationJob, ({ one, many }) => ({
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
  customPhoto: one(assetImage, {
    fields: [generationJob.customPhotoId],
    references: [assetImage.id],
  }),
  assetImages: many(assetImage),
}));

// Complete token ledger relations  
export const tokenLedgerCompleteRelations = relations(tokenLedger, ({ one }) => ({
  user: one(user, {
    fields: [tokenLedger.userId],
    references: [user.id],
  }),
  generationJob: one(generationJob, {
    fields: [tokenLedger.id],
    references: [generationJob.ledgerId],
  }),
}));

// Export all types
export type { User, NewUser } from './user';
export type { TokenAccount, NewTokenAccount, TokenLedger, NewTokenLedger } from './tokens';
export type { GenerationJob, NewGenerationJob } from './generation';
export type { AssetImage, NewAssetImage} from './assets';
export type { AuthOtp, NewAuthOtp } from './auth';
export type { Brand, NewBrand } from './brand';
export type { BrandExtractionStatus, NewBrandExtractionStatus } from './brandExtractionStatus';
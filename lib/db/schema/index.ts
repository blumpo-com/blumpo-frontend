import { relations } from 'drizzle-orm';

// Export all enums
export * from './enums';

// Export all tables
export { user } from './user';
export { tokenAccount, tokenLedger } from './tokens';
export { generationJob } from './generation';
export { authOtp } from './auth';
export { brand } from './brand';
export { brandInsights } from './brandInsights';
export { brandExtractionStatus } from './brandExtractionStatus';
export { subscriptionPlan, topupPlan, generationPricing } from './subscription';
export { adArchetype } from './adArchetype';
export { adWorkflow } from './adWorkflow';
export { adImage } from './adImage';
export { adEvent } from './adEvent';
export { adClone } from './adClone';

// Export individual relations
export { tokenAccountRelations, tokenLedgerRelations } from './tokens';
export { generationJobRelations } from './generation';
export { authOtpRelations } from './auth';
export { brandRelations } from './brand';
export { brandInsightsRelations } from './brandInsights';
export { brandExtractionStatusRelations } from './brandExtractionStatus';

// Import tables for cross-relations
import { user } from './user';
import { tokenAccount, tokenLedger } from './tokens';
import { generationJob } from './generation';
import { authOtp } from './auth';
import { brand } from './brand';
import { brandInsights } from './brandInsights';
import { brandExtractionStatus } from './brandExtractionStatus';
import { subscriptionPlan, topupPlan, generationPricing } from './subscription';
import { adArchetype } from './adArchetype';
import { adWorkflow } from './adWorkflow';
import { adImage } from './adImage';
import { adEvent } from './adEvent';
import { adClone } from './adClone';

// Define user relations now that all tables are available
export const userRelations = relations(user, ({ one, many }) => ({
  tokenAccount: one(tokenAccount, {
    fields: [user.id],
    references: [tokenAccount.userId],
  }),
  tokenLedgerEntries: many(tokenLedger),
  generationJobs: many(generationJob),
  adImages: many(adImage),
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
  archetype: one(adArchetype, {
    fields: [generationJob.archetypeCode],
    references: [adArchetype.code],
    relationName: 'archetypeJobs',
  }),
  adImages: many(adImage),
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

// Complete brand relations (add insights relation here to avoid circular dependency)
export const brandCompleteRelations = relations(brand, ({ one, many }) => ({
  insights: one(brandInsights, {
    fields: [brand.id],
    references: [brandInsights.brandId],
  }),
  adImages: many(adImage),
}));

// Ad archetype relations
export const adArchetypeCompleteRelations = relations(adArchetype, ({ many }) => ({
  workflows: many(adWorkflow, { relationName: 'archetypeWorkflows' }),
  generationJobs: many(generationJob, { relationName: 'archetypeJobs' }),
  adEvents: many(adEvent, { relationName: 'archetypeEvents' }),
}));

// Ad workflow relations
export const adWorkflowCompleteRelations = relations(adWorkflow, ({ one, many }) => ({
  archetype: one(adArchetype, {
    fields: [adWorkflow.archetypeCode],
    references: [adArchetype.code],
    relationName: 'archetypeWorkflows',
  }),
  adEvents: many(adEvent, { relationName: 'workflowEvents' }),
  adClones: many(adClone),
}));

// Ad clone relations
export const adCloneCompleteRelations = relations(adClone, ({ one }) => ({
  workflow: one(adWorkflow, {
    fields: [adClone.workflowId],
    references: [adWorkflow.id],
  }),
}));

// Ad image relations
export const adImageCompleteRelations = relations(adImage, ({ one, many }) => ({
  user: one(user, {
    fields: [adImage.userId],
    references: [user.id],
  }),
  generationJob: one(generationJob, {
    fields: [adImage.jobId],
    references: [generationJob.id],
  }),
  brand: one(brand, {
    fields: [adImage.brandId],
    references: [brand.id],
  }),
  adEvents: many(adEvent, { relationName: 'imageEvents' }),
}));

// Ad event relations
export const adEventCompleteRelations = relations(adEvent, ({ one }) => ({
  user: one(user, {
    fields: [adEvent.userId],
    references: [user.id],
  }),
  brand: one(brand, {
    fields: [adEvent.brandId],
    references: [brand.id],
  }),
  generationJob: one(generationJob, {
    fields: [adEvent.jobId],
    references: [generationJob.id],
  }),
  adImage: one(adImage, {
    fields: [adEvent.adImageId],
    references: [adImage.id],
    relationName: 'imageEvents',
  }),
  archetype: one(adArchetype, {
    fields: [adEvent.archetypeCode],
    references: [adArchetype.code],
    relationName: 'archetypeEvents',
  }),
  workflow: one(adWorkflow, {
    fields: [adEvent.workflowId],
    references: [adWorkflow.id],
    relationName: 'workflowEvents',
  }),
}));

// Export all types
export type { User, NewUser } from './user';
export type { TokenAccount, NewTokenAccount, TokenLedger, NewTokenLedger } from './tokens';
export type { GenerationJob, NewGenerationJob } from './generation';
export type { AuthOtp, NewAuthOtp } from './auth';
export type { Brand, NewBrand } from './brand';
export type { BrandInsights, NewBrandInsights } from './brandInsights';
export type { BrandExtractionStatus, NewBrandExtractionStatus } from './brandExtractionStatus';
export type { AdArchetype, NewAdArchetype } from './adArchetype';
export type { AdWorkflow, NewAdWorkflow } from './adWorkflow';
export type { AdImage, NewAdImage } from './adImage';
export type { AdEvent, NewAdEvent } from './adEvent';
export type { AdClone, NewAdClone } from './adClone';
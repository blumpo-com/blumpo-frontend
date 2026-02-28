import { db } from './drizzle';
import { user, tokenAccount, tokenLedger, generationJob, adImage, subscriptionPlan, topupPlan, brand, brandInsights, adArchetype, adWorkflow, adClone } from './schema/index';
import { JobStatus } from './schema/enums';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

// Ad archetypes from ad_archetype.json (code, displayName, description)
const AD_ARCHETYPE_SEED = [
  { code: 'competitor_comparison', displayName: 'Competitor Comparison', description: 'Visually present how the product works vs competitors' },
  { code: 'meme', displayName: 'Meme', description: "Use a familiar or humorous situation to instantly reflect the user's pain point, then flip it with your product as the obvious, satisfying solution" },
  { code: 'problem_solution', displayName: 'Problem-Solution', description: "Show user's pain point and how your product resolves it" },
  { code: 'promotion_offer', displayName: 'Promotion (Offer)', description: 'Communicate a clear, time-limited deal to prompt immediate action' },
  { code: 'random', displayName: 'Random', description: 'Use 2 random archetypes to generate ads' },
  { code: 'testimonial', displayName: 'Testimonial', description: 'Build the ad around a customer review or quote' },
  { code: 'value_proposition', displayName: 'Value Proposition', description: 'Highlight the core benefit and what sets the product apart' },
] as const;

// Ad workflows for meme archetype referenced by AD_CLONE_SEED (id, archetypeCode, workflowUid, variantKey, format, isActive) – from ad_workflow.json
const AD_WORKFLOW_SEED = [
  { id: 'bc27ada6-d6c9-469e-9cb2-028583354351', archetypeCode: 'meme' as const, workflowUid: 'SUB/IMG/meme14', variantKey: 'meme_14', format: null, isActive: true },
  { id: '5fedcd7b-4e88-411e-8fe9-5f31110c7b36', archetypeCode: 'meme' as const, workflowUid: 'SUB/IMG/meme24', variantKey: 'meme_24', format: null, isActive: true },
  { id: 'c1f07673-d7a1-4e79-bcb2-e9452a88a842', archetypeCode: 'meme' as const, workflowUid: 'SUB/IMG/meme26', variantKey: 'meme_26', format: null, isActive: true },
  { id: '11cafaa3-8628-4222-b5d7-05d5071ba5ba', archetypeCode: 'meme' as const, workflowUid: 'SUB/IMG/meme15', variantKey: 'meme_15', format: null, isActive: true },
  { id: '14338e60-dbaf-4fca-a49a-81e1700ef72c', archetypeCode: 'meme' as const, workflowUid: 'SUB/IMG/meme2', variantKey: 'meme_2', format: null, isActive: true },
  { id: 'addb38f3-36f6-4bd9-a5dd-051d477591c7', archetypeCode: 'meme' as const, workflowUid: 'SUB/IMG/meme9', variantKey: 'meme_9', format: null, isActive: true },
  { id: '3a1db067-1193-4659-8f22-098e703df424', archetypeCode: 'meme' as const, workflowUid: 'SUB/IMG/meme19', variantKey: 'meme_19', format: null, isActive: true },
  { id: 'c2df829d-d371-4ac5-a22e-b82ce5173287', archetypeCode: 'meme' as const, workflowUid: 'SUB/IMG/meme11', variantKey: 'meme_11', format: null, isActive: true },
  { id: '1209e019-b515-44c8-ac7c-a12e48b93c5a', archetypeCode: 'meme' as const, workflowUid: 'SUB/IMG/meme6', variantKey: 'meme_6', format: '1:1', isActive: true },
  { id: 'd0097679-b0e7-42bb-80b5-253acfac436d', archetypeCode: 'meme' as const, workflowUid: 'SUB/IMG/meme18', variantKey: 'meme_18', format: null, isActive: true },
  { id: 'c56ff495-0030-49c2-abaf-b8737e33f878', archetypeCode: 'meme' as const, workflowUid: 'SUB/IMG/meme22', variantKey: 'meme_22', format: null, isActive: true },
  { id: '62498a70-7ba6-419c-b548-a9f0e03e987e', archetypeCode: 'meme' as const, workflowUid: 'SUB/IMG/meme12', variantKey: 'meme_12', format: null, isActive: true },
  { id: '411b0d63-a2ac-46ad-aa51-5de68509b791', archetypeCode: 'meme' as const, workflowUid: 'SUB/IMG/meme4', variantKey: 'meme_4', format: null, isActive: true },
  { id: 'dcb16816-3187-410d-a9b5-eec1382ba564', archetypeCode: 'meme' as const, workflowUid: 'SUB/IMG/meme25', variantKey: 'meme_25', format: null, isActive: true },
  { id: '14e6e11d-1735-4f2f-8280-624dc2ce8d99', archetypeCode: 'meme' as const, workflowUid: 'SUB/IMG/meme21', variantKey: 'meme_21', format: null, isActive: true },
  { id: '675e8d39-57a1-47f9-8229-b7d1dd86c2e6', archetypeCode: 'meme' as const, workflowUid: 'SUB/IMG/meme1', variantKey: 'meme_1', format: '1:1', isActive: true },
  { id: 'fa35b7da-a7b6-46b3-bc71-d81c982e2490', archetypeCode: 'meme' as const, workflowUid: 'SUB/IMG/meme3', variantKey: 'meme_3', format: null, isActive: true },
  { id: '82c81e5f-3683-4e60-916e-171ced7720da', archetypeCode: 'meme' as const, workflowUid: 'SUB/IMG/meme10', variantKey: 'meme_10', format: null, isActive: true },
  { id: 'fe1dbf33-3227-42dc-90fa-9ce38ff16c1e', archetypeCode: 'meme' as const, workflowUid: 'SUB/IMG/meme5', variantKey: 'meme_5', format: '1:1', isActive: true },
  { id: 'd4dcc6f3-7ac2-4dc8-988e-a6c9ab888e03', archetypeCode: 'meme' as const, workflowUid: 'SUB/IMG/meme16', variantKey: 'meme_16', format: null, isActive: true },
  { id: 'debe9d83-be31-413a-aab8-7ab033cb9579', archetypeCode: 'meme' as const, workflowUid: 'SUB/IMG/meme13', variantKey: 'meme_13', format: null, isActive: true },
  { id: '5db32658-17e1-4b7f-9bba-9ea8622e2434', archetypeCode: 'meme' as const, workflowUid: 'SUB/IMG/meme8', variantKey: 'meme_8', format: null, isActive: true },
  { id: 'd47afc67-97cd-475a-a6f4-929306092704', archetypeCode: 'meme' as const, workflowUid: 'SUB/IMG/meme7', variantKey: 'meme_7', format: '1:1', isActive: true },
  { id: 'aa55b5cf-f852-40d5-825b-a63f80f86f63', archetypeCode: 'meme' as const, workflowUid: 'SUB/IMG/meme20', variantKey: 'meme_20', format: null, isActive: true },
  { id: '21be6e19-b291-40dc-995e-130211bb3195', archetypeCode: 'meme' as const, workflowUid: 'SUB/IMG/meme23', variantKey: 'meme_23', format: null, isActive: true },
  { id: '34a44f20-bab8-4ed4-8742-5ee5f3107fbc', archetypeCode: 'meme' as const, workflowUid: 'SUB/IMG/meme17', variantKey: 'meme_17', format: null, isActive: true },
] as const;

// Ad clone seed data (meme clones) – workflow_id must exist in ad_workflow
const AD_CLONE_SEED = [
  { id: '030d2305-eb53-489c-a1e5-1598816e2ae6', workflowId: 'bc27ada6-d6c9-469e-9cb2-028583354351', storageKey: 'clone/meme/today-was-a-good-day-v0-vmi4zvceog8g1.webp', storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/meme/today-was-a-good-day-v0-vmi4zvceog8g1.webp', createdAt: '2026-02-03 14:54:43.486334+00' },
  { id: '031a339c-0866-4043-aadc-269ee6b989b6', workflowId: '5fedcd7b-4e88-411e-8fe9-5f31110c7b36', storageKey: 'clone/meme/meme24.webp', storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/meme/meme24.webp', createdAt: '2026-02-03 14:54:43.486334+00' },
  { id: '24881b1d-151c-41ac-be94-90a1559db46a', workflowId: 'c1f07673-d7a1-4e79-bcb2-e9452a88a842', storageKey: 'clone/meme/its-the-eye-of-the-tiger-its-the-thrill-of-the-fight-v0-pa2frpndmfcg1.webp', storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/meme/its-the-eye-of-the-tiger-its-the-thrill-of-the-fight-v0-pa2frpndmfcg1.webp', createdAt: '2026-02-03 14:54:43.486334+00' },
  { id: '24f99dd3-4f0f-40ca-b8e2-b350624a0184', workflowId: '11cafaa3-8628-4222-b5d7-05d5071ba5ba', storageKey: 'clone/meme/meme15.webp', storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/meme/meme15.webp', createdAt: '2026-02-03 14:54:43.486334+00' },
  { id: '3ec30d53-57a3-48fc-a361-9a30e3a241ca', workflowId: '14338e60-dbaf-4fca-a49a-81e1700ef72c', storageKey: 'clone/meme/meme28.webp', storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/meme/meme28.webp', createdAt: '2026-02-03 14:54:43.486334+00' },
  { id: '4803e471-a8db-4a89-a6f6-cc0ecc5d0771', workflowId: 'addb38f3-36f6-4bd9-a5dd-051d477591c7', storageKey: 'clone/meme/meme9.webp', storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/meme/meme9.webp', createdAt: '2026-02-03 14:54:43.486334+00' },
  { id: '4ef40003-5f11-4d76-9330-9ce0aa7ba588', workflowId: '3a1db067-1193-4659-8f22-098e703df424', storageKey: 'clone/meme/if-a-person-wrongly-harms-another-in-anyway-possible-that-v0-uzbw6mw2uicg1.webp', storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/meme/if-a-person-wrongly-harms-another-in-anyway-possible-that-v0-uzbw6mw2uicg1.webp', createdAt: '2026-02-03 14:54:43.486334+00' },
  { id: '519af415-cb2a-425a-9b40-f9118ef7527a', workflowId: 'c2df829d-d371-4ac5-a22e-b82ce5173287', storageKey: 'clone/meme/meme11.webp', storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/meme/meme11.webp', createdAt: '2026-02-03 14:54:43.486334+00' },
  { id: '545553e4-4836-4a2d-9bed-05618fc6fed4', workflowId: '1209e019-b515-44c8-ac7c-a12e48b93c5a', storageKey: 'clone/meme/meme6.jpg', storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/meme/meme6.jpg', createdAt: '2026-02-03 14:54:43.486334+00' },
  { id: '5c5c29c2-b99d-45c2-8de4-c8b7fda0bc05', workflowId: 'd0097679-b0e7-42bb-80b5-253acfac436d', storageKey: 'clone/meme/meme18.webp', storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/meme/meme18.webp', createdAt: '2026-02-03 14:54:43.486334+00' },
  { id: '5e732c4b-90a8-4450-81ec-2fbb1ec2c72c', workflowId: 'c56ff495-0030-49c2-abaf-b8737e33f878', storageKey: 'clone/meme/meme22.webp', storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/meme/meme22.webp', createdAt: '2026-02-03 14:54:43.486334+00' },
  { id: '70132999-4af8-4f10-ac0d-ff1bb5f45bc7', workflowId: '62498a70-7ba6-419c-b548-a9f0e03e987e', storageKey: 'clone/meme/meme12.webp', storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/meme/meme12.webp', createdAt: '2026-02-03 14:54:43.486334+00' },
  { id: '7ff20bac-c7d0-420c-9935-6226a8667558', workflowId: '411b0d63-a2ac-46ad-aa51-5de68509b791', storageKey: 'clone/meme/meme4.jpg', storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/meme/meme4.jpg', createdAt: '2026-02-03 14:54:43.486334+00' },
  { id: '86062026-2e89-45fa-94c7-fa93588c86ef', workflowId: 'dcb16816-3187-410d-a9b5-eec1382ba564', storageKey: 'clone/meme/were-done-when-i-say-were-done-v0-5c80qq0r4ebg1.webp', storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/meme/were-done-when-i-say-were-done-v0-5c80qq0r4ebg1.webp', createdAt: '2026-02-03 14:54:43.486334+00' },
  { id: '9f774f11-84e7-4b32-876e-315cd1204d7e', workflowId: '14e6e11d-1735-4f2f-8280-624dc2ce8d99', storageKey: 'clone/meme/meme21.webp', storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/meme/meme21.webp', createdAt: '2026-02-03 14:54:43.486334+00' },
  { id: 'a5cf5737-9b64-437c-9eb8-889ccc7b1662', workflowId: '675e8d39-57a1-47f9-8229-b7d1dd86c2e6', storageKey: 'clone/meme/meme1.jpg', storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/meme/meme1.jpg', createdAt: '2026-02-03 14:54:43.486334+00' },
  { id: 'c61434cb-3557-4424-8201-1c78a3ab0a78', workflowId: 'fa35b7da-a7b6-46b3-bc71-d81c982e2490', storageKey: 'clone/meme/meme3.jpg', storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/meme/meme3.jpg', createdAt: '2026-02-03 14:54:43.486334+00' },
  { id: 'cb6905b8-9091-4a0d-bedc-98159e425f86', workflowId: '82c81e5f-3683-4e60-916e-171ced7720da', storageKey: 'clone/meme/meme10.webp', storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/meme/meme10.webp', createdAt: '2026-02-03 14:54:43.486334+00' },
  { id: 'd0d58736-a330-4c78-910d-1fe99ba5c817', workflowId: 'fe1dbf33-3227-42dc-90fa-9ce38ff16c1e', storageKey: 'clone/meme/meme4.webp', storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/meme/meme4.webp', createdAt: '2026-02-03 14:54:43.486334+00' },
  { id: 'd381005c-d385-42f4-9be2-c39bd02e5438', workflowId: 'd4dcc6f3-7ac2-4dc8-988e-a6c9ab888e03', storageKey: 'clone/meme/meme27.webp', storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/meme/meme27.webp', createdAt: '2026-02-03 14:54:43.486334+00' },
  { id: 'd8353399-c6e4-4abf-a240-8daaafb55ba2', workflowId: 'debe9d83-be31-413a-aab8-7ab033cb9579', storageKey: 'clone/meme/meme13.webp', storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/meme/meme13.webp', createdAt: '2026-02-03 14:54:43.486334+00' },
  { id: 'ded9786a-9263-4966-8608-8000a5ed4916', workflowId: '5db32658-17e1-4b7f-9bba-9ea8622e2434', storageKey: 'clone/meme/meme8.jpg', storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/meme/meme8.jpg', createdAt: '2026-02-03 14:54:43.486334+00' },
  { id: 'ea0bd5c0-70d8-43b3-80d5-d16268f2edfb', workflowId: 'd47afc67-97cd-475a-a6f4-929306092704', storageKey: 'clone/meme/meme7.jpg', storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/meme/meme7.jpg', createdAt: '2026-02-03 14:54:43.486334+00' },
  { id: 'ebc47727-9214-4ad3-b3cb-c325fc1ab515', workflowId: 'aa55b5cf-f852-40d5-825b-a63f80f86f63', storageKey: 'clone/meme/meme20.webp', storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/meme/meme20.webp', createdAt: '2026-02-03 14:54:43.486334+00' },
  { id: 'f1a3eee9-281e-42bc-af80-bb8ace0d09cc', workflowId: '21be6e19-b291-40dc-995e-130211bb3195', storageKey: 'clone/meme/meme23.webp', storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/meme/meme23.webp', createdAt: '2026-02-03 14:54:43.486334+00' },
  { id: 'fb315a67-9e1a-4ec1-b91d-edfbef126c6f', workflowId: '34a44f20-bab8-4ed4-8742-5ee5f3107fbc', storageKey: 'clone/meme/meme17.webp', storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/meme/meme17.webp', createdAt: '2026-02-03 14:54:43.486334+00' },
] as const;

const TEST_USER_EMAIL = 'test@blumpo.com';

async function createTestUser(): Promise<{ user: { id: string; email: string }; created: boolean }> {
  console.log('Creating test user...');

  const existing = await db.select().from(user).where(eq(user.email, TEST_USER_EMAIL)).limit(1);
  if (existing.length > 0) {
    console.log('Test user already exists:', existing[0].email);
    return { user: existing[0], created: false };
  }

  const testUserId = crypto.randomUUID();

  const [newUser] = await db
    .insert(user)
    .values({
      id: testUserId,
      email: TEST_USER_EMAIL,
      displayName: 'Test User',
      photoUrl: null,
      phoneNumber: null,
    })
    .returning();

  console.log('Test user created:', newUser!.email);

  await db.insert(tokenAccount).values({
    userId: testUserId,
    balance: 50,
    planCode: 'FREE',
  });

  await db.insert(tokenLedger).values({
    userId: testUserId,
    delta: 50,
    reason: 'INITIAL_GRANT',
    referenceId: `seed_${testUserId}`,
    balanceAfter: 50,
  });

  console.log('Initial token grant recorded.');
  return { user: newUser!, created: true };
}

async function createSampleBrand(userId: string) {
  console.log('Creating sample brand...');
  
  const brandId = crypto.randomUUID();
  
  // Create brand (core data only)
  const [newBrand] = await db
    .insert(brand)
    .values({
      id: brandId,
      userId,
      name: 'Sample Brand',
      websiteUrl: 'https://example.com',
      language: 'en',
      fonts: ['Arial', 'Helvetica'],
      colors: ['#FF0000', '#00FF00'],
      photos: [],
      heroPhotos: [],
    })
    .returning();

  // Create brand insights (separate table)
  await db
    .insert(brandInsights)
    .values({
      brandId: brandId,
      clientAdPreferences: {},
      industry: 'Technology',
      customerPainPoints: ['High costs', 'Complex setup'],
      productDescription: 'A sample product for testing',
      keyFeatures: ['Feature 1', 'Feature 2'],
      brandVoice: 'Professional and friendly',
      uniqueValueProp: 'The best solution for your needs',
      keyBenefits: ['Benefit 1', 'Benefit 2'],
      competitors: ['Competitor A', 'Competitor B'],
      insTriggerEvents: [],
      insAspirations: [],
      insMarketingInsight: null,
      insTrendOpportunity: null,
      insRaw: [],
      targetCustomers: ['Tech startups', 'Small businesses'],
      solution: 'A comprehensive solution that addresses key pain points',
    });

  console.log('Sample brand created:', newBrand.id);
  return newBrand;
}

async function createSampleGenerationJob(userId: string, brandId: string) {
  console.log('Creating sample generation job...');
  
  const jobId = crypto.randomUUID();
  const imageId = crypto.randomUUID();
  
  // Create generation job
  const [job] = await db
    .insert(generationJob)
    .values({
      id: jobId,
      userId,
      brandId,
      status: JobStatus.SUCCEEDED,
      prompt: 'A beautiful landscape with mountains and a lake at sunset',
      params: {
        width: 1024,
        height: 1024,
        steps: 20,
        cfg: 7.5,
        seed: 12345,
      },
      tokensCost: 50,
      startedAt: new Date(Date.now() - 30000), // 30 seconds ago
      completedAt: new Date(),
      archetypeInputs: {},
    })
    .returning();

  console.log('Generation job created:', job.id);

  // Deduct tokens for the job
  await db
    .insert(tokenLedger)
    .values({
      userId,
      delta: -50,
      reason: 'JOB_RESERVE',
      referenceId: jobId,
      balanceAfter: 0,
    });

  // Update token account balance
  await db
    .update(tokenAccount)
    .set({ balance: 0 })
    .where(eq(tokenAccount.userId, userId));

  // Create ad image
  await db
    .insert(adImage)
    .values({
      id: imageId,
      jobId,
      userId,
      brandId: brandId,
      title: 'Beautiful Sunset Landscape',
      storageKey: `users/${userId}/jobs/${jobId}/${imageId}.webp`,
      publicUrl: `https://cdn.blumpo.com/images/${imageId}.webp`,
      bytesSize: 524288, // 512KB
      width: 1024,
      height: 1024,
      format: 'WEBP',
      workflowId: null, // No workflow for seed data
      isDeleted: false,
    });

  console.log('Sample ad image created for job.');

  return job;
}

async function seedSubscriptionPlans() {
  console.log('Creating subscription plans...');

  const plans = [
    {
      planCode: 'FREE',
      displayName: 'Free Plan',
      monthlyTokens: 50,
      description: [
        '50 tokens per month',
        'Basic ad generation',
        'Email support',
      ],
      stripeProductId: null,
      isActive: true,
      isDefault: true,
      sortOrder: 1,
    },
    {
      planCode: 'STARTER',
      displayName: 'Starter',
      monthlyTokens: 1000,
      description: [
        '100 ads created per month',
        'Ads creation in +10 archetypes',
        'Various sizes and formats supported (1:1, 9:16)',
        '1 Brand',
      ],
      stripeProductId: process.env.STRIPE_STARTER_PRODUCT_ID || null,
      isActive: true,
      isDefault: false,
      sortOrder: 2,
    },
    {
      planCode: 'GROWTH',
      displayName: 'Growth',
      monthlyTokens: 3000,
      description: [
        '300 ads created per month',
        'Ads creation in +10 archetypes',
        'Various sizes and formats supported (1:1, 9:16)',
        'Customer & competitor insight access',
        'Up to 3 brands',
      ],
      stripeProductId: process.env.STRIPE_GROWTH_PRODUCT_ID || null,
      isActive: true,
      isDefault: false,
      sortOrder: 3,
    },
    {
      planCode: 'TEAM',
      displayName: 'Team',
      monthlyTokens: 30000,
      description: [
        '3000 ads created per month',
        'Ads creation in +10 archetypes',
        'Various sizes and formats supported (1:1, 9:16)',
        'Customer & competitor insight access',
        'Unlimited number of brands',
        'Up to 5 users',
      ],
      stripeProductId: process.env.STRIPE_TEAM_PRODUCT_ID || null,
      isActive: true,
      isDefault: false,
      sortOrder: 4,
    },
  ];

  for (const plan of plans) {
    await db.insert(subscriptionPlan).values(plan).onConflictDoNothing({
      target: subscriptionPlan.planCode,
    });
  }

  console.log('Subscription plans seeded (existing rows left unchanged).');
}

async function seedTopupPlans() {
  console.log('Creating topup plans...');

  const topups = [
    {
      topupSku: 'TOPUP_100',
      displayName: '100 Tokens',
      tokensAmount: 100,
      stripeProductId: process.env.STRIPE_TOPUP_100_PRODUCT_ID || null,
      isActive: true,
      sortOrder: 1,
    },
    {
      topupSku: 'TOPUP_500',
      displayName: '500 Tokens',
      tokensAmount: 500,
      stripeProductId: process.env.STRIPE_TOPUP_500_PRODUCT_ID || null,
      isActive: true,
      sortOrder: 2,
    },
    {
      topupSku: 'TOPUP_2000',
      displayName: '2000 Tokens',
      tokensAmount: 2000,
      stripeProductId: process.env.STRIPE_TOPUP_2000_PRODUCT_ID || null,
      isActive: true,
      sortOrder: 3,
    },
  ];

  for (const topup of topups) {
    await db.insert(topupPlan).values(topup).onConflictDoNothing({
      target: topupPlan.topupSku,
    });
  }

  console.log('Topup plans seeded (existing rows left unchanged).');
}

async function seedAdArchetypes() {
  console.log('Seeding ad_archetype...');
  for (const row of AD_ARCHETYPE_SEED) {
    await db
      .insert(adArchetype)
      .values({
        code: row.code,
        displayName: row.displayName,
        description: row.description ?? null,
      })
      .onConflictDoNothing({ target: adArchetype.code });
  }
  console.log('Ad archetypes seeded:', AD_ARCHETYPE_SEED.length);
}

async function seedAdCloneWorkflowsAndClones() {
  console.log('Seeding ad_workflow rows for ad_clone and ad_clone...');

  for (const row of AD_WORKFLOW_SEED) {
    await db
      .insert(adWorkflow)
      .values({
        id: row.id,
        archetypeCode: row.archetypeCode,
        workflowUid: row.workflowUid,
        variantKey: row.variantKey,
        format: row.format,
        isActive: row.isActive,
      })
      .onConflictDoNothing({ target: adWorkflow.id });
  }

  for (const row of AD_CLONE_SEED) {
    await db
      .insert(adClone)
      .values({
        id: row.id,
        workflowId: row.workflowId,
        storageKey: row.storageKey,
        storageUrl: row.storageUrl,
        createdAt: new Date(row.createdAt),
      })
      .onConflictDoNothing({ target: adClone.id });
  }

  console.log('Ad workflow and ad_clone seed completed:', AD_WORKFLOW_SEED.length, 'workflows,', AD_CLONE_SEED.length, 'clones.');
}

async function seed() {
  try {
    console.log('🌱 Starting database seed...');

    // Create subscription and topup plans first
    await seedSubscriptionPlans();
    await seedTopupPlans();

    // Seed ad_archetype, then ad_workflow + ad_clone (meme clones)
    await seedAdArchetypes();
    await seedAdCloneWorkflowsAndClones();

    // Create test user with token account (skip brand/job if user already exists)
    const { user: testUser, created } = await createTestUser();

    if (created) {
      const sampleBrand = await createSampleBrand(testUser.id);
      await createSampleGenerationJob(testUser.id, sampleBrand.id);
      console.log('\nTest credentials:');
      console.log('Email: test@blumpo.com');
      console.log('Initial token balance: 0 tokens (50 tokens used for sample generation)');
    } else {
      console.log('Skipped sample brand and generation job (test user already existed).');
    }

    console.log('✅ Database seed completed successfully!');
    console.log('\nSubscription plans and topup plans have been created.');
    
  } catch (error) {
    console.error('❌ Seed process failed:', error);
    throw error;
  }
}

if (require.main === module) {
  seed()
    .catch((error) => {
      console.error('Seed process failed:', error);
      process.exit(1);
    })
    .finally(() => {
      console.log('Seed process finished. Exiting...');
      process.exit(0);
    });
}

export { seed };

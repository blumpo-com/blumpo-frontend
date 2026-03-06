import { db } from './drizzle';
import { user, tokenAccount, tokenLedger, generationJob, adImage, subscriptionPlan, topupPlan, brand, brandInsights, adArchetype, adWorkflow, adClone } from './schema/index';
import { JobStatus } from './schema/enums';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { getStorageKeyFromBlobUrl } from '@/lib/utils';

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

// Meme clone ads: storageUrl, variantKey, workflowUid (workflows created on seed; storage key derived from URL)
const AD_CLONE_MEME_ENTRIES = [
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/meme/meme1.jpg', variantKey: 'meme_1', workflowUid: 'SUB/IMG/meme1' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/meme/meme28.webp', variantKey: 'meme_2', workflowUid: 'SUB/IMG/meme2' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/meme/meme3.jpg', variantKey: 'meme_3', workflowUid: 'SUB/IMG/meme3' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/meme/meme4.jpg', variantKey: 'meme_4', workflowUid: 'SUB/IMG/meme4' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/meme/meme4.webp', variantKey: 'meme_5', workflowUid: 'SUB/IMG/meme5' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/meme/meme6.jpg', variantKey: 'meme_6', workflowUid: 'SUB/IMG/meme6' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/meme/meme7.jpg', variantKey: 'meme_7', workflowUid: 'SUB/IMG/meme7' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/meme/meme8.jpg', variantKey: 'meme_8', workflowUid: 'SUB/IMG/meme8' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/meme/meme9.webp', variantKey: 'meme_9', workflowUid: 'SUB/IMG/meme9' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/meme/meme10.webp', variantKey: 'meme_10', workflowUid: 'SUB/IMG/meme10' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/meme/meme11.webp', variantKey: 'meme_11', workflowUid: 'SUB/IMG/meme11' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/meme/meme12.webp', variantKey: 'meme_12', workflowUid: 'SUB/IMG/meme12' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/meme/meme13.webp', variantKey: 'meme_13', workflowUid: 'SUB/IMG/meme13' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/meme/today-was-a-good-day-v0-vmi4zvceog8g1.webp', variantKey: 'meme_14', workflowUid: 'SUB/IMG/meme14' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/meme/meme15.webp', variantKey: 'meme_15', workflowUid: 'SUB/IMG/meme15' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/meme/meme27.webp', variantKey: 'meme_16', workflowUid: 'SUB/IMG/meme16' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/meme/meme17.webp', variantKey: 'meme_17', workflowUid: 'SUB/IMG/meme17' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/meme/meme18.webp', variantKey: 'meme_18', workflowUid: 'SUB/IMG/meme18' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/meme/if-a-person-wrongly-harms-another-in-anyway-possible-that-v0-uzbw6mw2uicg1.webp', variantKey: 'meme_19', workflowUid: 'SUB/IMG/meme19' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/meme/meme20.webp', variantKey: 'meme_20', workflowUid: 'SUB/IMG/meme20' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/meme/meme21.webp', variantKey: 'meme_21', workflowUid: 'SUB/IMG/meme21' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/meme/meme22.webp', variantKey: 'meme_22', workflowUid: 'SUB/IMG/meme22' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/meme/meme23.webp', variantKey: 'meme_23', workflowUid: 'SUB/IMG/meme23' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/meme/meme24.webp', variantKey: 'meme_24', workflowUid: 'SUB/IMG/meme24' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/meme/were-done-when-i-say-were-done-v0-5c80qq0r4ebg1.webp', variantKey: 'meme_25', workflowUid: 'SUB/IMG/meme25' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/meme/its-the-eye-of-the-tiger-its-the-thrill-of-the-fight-v0-pa2frpndmfcg1.webp', variantKey: 'meme_26', workflowUid: 'SUB/IMG/meme26' },
];

// Problem-solution clone ads: storageUrl, variantKey, workflowUid (workflows created on seed; storage key derived from URL)
const AD_CLONE_PS_ENTRIES = [
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/tes5.jpg', variantKey: 'ps_5', workflowUid: 'SUB/IMG/PS5' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/tes6', variantKey: 'ps_6', workflowUid: 'SUB/IMG/PS6' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/ae83a6f3-d1bb-48e3-8787-910aca3abd95.webp', variantKey: 'ps_7', workflowUid: 'SUB/IMG/PS7' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/tes4.jpg', variantKey: 'ps_8', workflowUid: 'SUB/IMG/PS8' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/ps9.webp', variantKey: 'ps_9', workflowUid: 'SUB/IMG/PS9' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/ps10.png', variantKey: 'ps_10', workflowUid: 'SUB/IMG/PS10' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/ps11.webp', variantKey: 'ps_11', workflowUid: 'SUB/IMG/PS11' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/ps12.webp', variantKey: 'ps_12', workflowUid: 'SUB/IMG/PS12' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/b78b2c30-cb00-4e20-a36c-18f1767669b9.webp', variantKey: 'ps_13', workflowUid: 'SUB/IMG/PS13' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/ps14.webp', variantKey: 'ps_14', workflowUid: 'SUB/IMG/PS14' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/ps18.jpg', variantKey: 'ps_18', workflowUid: 'SUB/IMG/PS18' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/ps19.jpg', variantKey: 'ps_19', workflowUid: 'SUB/IMG/PS19' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/ps20.jpg', variantKey: 'ps_20', workflowUid: 'SUB/IMG/PS20' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/ps21.jpg', variantKey: 'ps_21', workflowUid: 'SUB/IMG/PS21' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/ps22.webp', variantKey: 'ps_22', workflowUid: 'SUB/IMG/PS22' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/ps23.jpg', variantKey: 'ps_23', workflowUid: 'SUB/IMG/PS23' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/ps24.webp', variantKey: 'ps_24', workflowUid: 'SUB/IMG/PS24' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/problem%20solution/ps27.webp', variantKey: 'ps_27', workflowUid: 'SUB/IMG/PS27' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/problem%20solution/ps29.webp', variantKey: 'ps_29', workflowUid: 'SUB/IMG/PS29' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/problem%20solution/ps30.webp', variantKey: 'ps_30', workflowUid: 'SUB/IMG/PS30' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/problem%20solution/ps31.webp', variantKey: 'ps_31', workflowUid: 'SUB/IMG/PS31' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/problem%20solution/ps32.webp', variantKey: 'ps_32', workflowUid: 'SUB/IMG/PS32' },
];

// Value proposition clone ads: storageUrl, variantKey, workflowUid
const AD_CLONE_VALP_ENTRIES = [
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/value%20proposition/valp5.jpg', variantKey: 'valp_5', workflowUid: 'SUB/IMG/VALP5' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/value%20proposition/valp26.webp', variantKey: 'valp_6', workflowUid: 'SUB/IMG/VALP6' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/value%20proposition/valp7.jpg', variantKey: 'valp_7', workflowUid: 'SUB/IMG/VALP7' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/value%20proposition/valp27.webp', variantKey: 'valp_8', workflowUid: 'SUB/IMG/VALP8' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/value%20proposition/valp9.jpg', variantKey: 'valp_9', workflowUid: 'SUB/IMG/VALP9' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/value%20proposition/valp11.jpg', variantKey: 'valp_11', workflowUid: 'SUB/IMG/VALP11' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/value%20proposition/valp12.webp', variantKey: 'valp_12', workflowUid: 'SUB/IMG/VALP12' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/value%20proposition/valp13.jpg', variantKey: 'valp_13', workflowUid: 'SUB/IMG/VALP13' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/value%20proposition/valp14.webp', variantKey: 'valp_14', workflowUid: 'SUB/IMG/VALP14' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/value%20proposition/valp15.webp', variantKey: 'valp_15', workflowUid: 'SUB/IMG/VALP15' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/value%20proposition/valp17.webp', variantKey: 'valp_17', workflowUid: 'SUB/IMG/VALP17' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/value%20proposition/valp18.webp', variantKey: 'valp_18', workflowUid: 'SUB/IMG/VALP18' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/value%20proposition/valp24.webp', variantKey: 'valp_19', workflowUid: 'SUB/IMG/VALP19' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/value%20proposition/valp20.jpg', variantKey: 'valp_20', workflowUid: 'SUB/IMG/VALP20' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/value%20proposition/valp21.webp', variantKey: 'valp_21', workflowUid: 'SUB/IMG/VALP21' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/value%20proposition/valp22.webp', variantKey: 'valp_22', workflowUid: 'SUB/IMG/VALP22' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/value%20proposition/valp23.jpg', variantKey: 'valp_23', workflowUid: 'SUB/IMG/VALP23' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/value%20proposition/valp25.webp', variantKey: 'valp_25', workflowUid: 'SUB/IMG/VALP25' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/value%20proposition/valp26.webp', variantKey: 'valp_26', workflowUid: 'SUB/IMG/VALP26' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/value%20proposition/valp27.webp', variantKey: 'valp_27', workflowUid: 'SUB/IMG/VALP27' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/value%20proposition/valp28.webp', variantKey: 'valp_28', workflowUid: 'SUB/IMG/VALP28' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/value%20proposition/valp29.webp', variantKey: 'valp_29', workflowUid: 'SUB/IMG/VALP29' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/value%20proposition/valp30.webp', variantKey: 'valp_30', workflowUid: 'SUB/IMG/VALP30' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/value%20proposition/3317.webp', variantKey: 'valp_31', workflowUid: 'SUB/IMG/VALP31' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/value%20proposition/valp32.webp', variantKey: 'valp_32', workflowUid: 'SUB/IMG/VALP32' },
];

// Testimonial clone ads: storageUrl, variantKey, workflowUid
const AD_CLONE_TES_ENTRIES = [
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/testimonial/tes7.jpeg', variantKey: 'tes_7', workflowUid: 'SUB/IMG/TES/7' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/testimonial/tes13.webp', variantKey: 'tes_8', workflowUid: 'SUB/IMG/TES/8' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/testimonial/tes12.jpg', variantKey: 'tes_12', workflowUid: 'SUB/IMG/TES/12' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/testimonial/tes13.1.webp', variantKey: 'tes_13', workflowUid: 'SUB/IMG/TES/13' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/testimonial/tes16.webp', variantKey: 'tes_16', workflowUid: 'SUB/IMG/TES/16' },
];

// Competitor comparison clone ads: storageUrl, variantKey, workflowUid
const AD_CLONE_COMP_ENTRIES = [
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/competition/comp4.jpeg', variantKey: 'comp_4', workflowUid: 'SUB/COM/IMG4' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/competition/comp5.png', variantKey: 'comp_5', workflowUid: 'SUB/COM/IMG5' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/competition/comp6.png', variantKey: 'comp_6', workflowUid: 'SUB/COM/IMG6' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/competition/comp7.webp', variantKey: 'comp_7', workflowUid: 'SUB/COM/IMG7' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/competition/comp8.webp', variantKey: 'comp_8', workflowUid: 'SUB/COM/IMG8' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/competition/comp10.webp', variantKey: 'comp_9', workflowUid: 'SUB/COM/IMG9' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/competition/comp13.jpeg', variantKey: 'comp_10', workflowUid: 'SUB/COM/IMG10' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/competition/comp11.webp', variantKey: 'comp_11', workflowUid: 'SUB/COM/IMG11' },
  { storageUrl: 'https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/clone/competition/comp12.webp', variantKey: 'comp_12', workflowUid: 'SUB/COM/IMG12' },
];

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

async function getOrCreateWorkflowId(workflowUid: string, variantKey: string, archetypeCode: string): Promise<string> {
  const existing = await db.select().from(adWorkflow).where(eq(adWorkflow.workflowUid, workflowUid)).limit(1);
  if (existing.length > 0) return existing[0].id;
  const id = crypto.randomUUID();
  await db
    .insert(adWorkflow)
    .values({
      id,
      archetypeCode,
      workflowUid,
      variantKey,
      format: null,
      isActive: true,
    })
    .onConflictDoNothing({ target: adWorkflow.workflowUid });
  const after = await db.select().from(adWorkflow).where(eq(adWorkflow.workflowUid, workflowUid)).limit(1);
  return after[0]!.id;
}

async function seedAdCloneWorkflowsAndClones() {
  console.log('Seeding ad_workflow and ad_clone (clone ads)...');

  // Meme clone ads
  for (const entry of AD_CLONE_MEME_ENTRIES) {
    const storageKey = getStorageKeyFromBlobUrl(entry.storageUrl);
    if (!storageKey) {
      console.warn('Skipping clone (invalid URL):', entry.storageUrl);
      continue;
    }
    const workflowId = await getOrCreateWorkflowId(entry.workflowUid, entry.variantKey, 'meme');
    await db
      .insert(adClone)
      .values({
        workflowId,
        storageKey,
        storageUrl: entry.storageUrl,
      })
      .onConflictDoNothing({ target: [adClone.workflowId] });
  }

  // Problem-solution clone ads ensure workflow by workflowUid, then insert clone with storage key from URL
  for (const entry of AD_CLONE_PS_ENTRIES) {
    const storageKey = getStorageKeyFromBlobUrl(entry.storageUrl);
    if (!storageKey) {
      console.warn('Skipping clone (invalid URL):', entry.storageUrl);
      continue;
    }
    const workflowId = await getOrCreateWorkflowId(entry.workflowUid, entry.variantKey, 'problem_solution');
    await db
      .insert(adClone)
      .values({
        workflowId,
        storageKey,
        storageUrl: entry.storageUrl,
      })
      .onConflictDoNothing({ target: [adClone.workflowId] });
  }

  // Value proposition clone ads
  for (const entry of AD_CLONE_VALP_ENTRIES) {
    const storageKey = getStorageKeyFromBlobUrl(entry.storageUrl);
    if (!storageKey) {
      console.warn('Skipping clone (invalid URL):', entry.storageUrl);
      continue;
    }
    const workflowId = await getOrCreateWorkflowId(entry.workflowUid, entry.variantKey, 'value_proposition');
    await db
      .insert(adClone)
      .values({
        workflowId,
        storageKey,
        storageUrl: entry.storageUrl,
      })
      .onConflictDoNothing({ target: [adClone.workflowId] });
  }

  // Testimonial clone ads
  for (const entry of AD_CLONE_TES_ENTRIES) {
    const storageKey = getStorageKeyFromBlobUrl(entry.storageUrl);
    if (!storageKey) {
      console.warn('Skipping clone (invalid URL):', entry.storageUrl);
      continue;
    }
    const workflowId = await getOrCreateWorkflowId(entry.workflowUid, entry.variantKey, 'testimonial');
    await db
      .insert(adClone)
      .values({
        workflowId,
        storageKey,
        storageUrl: entry.storageUrl,
      })
      .onConflictDoNothing({ target: [adClone.workflowId] });
  }

  // Competitor comparison clone ads
  for (const entry of AD_CLONE_COMP_ENTRIES) {
    const storageKey = getStorageKeyFromBlobUrl(entry.storageUrl);
    if (!storageKey) {
      console.warn('Skipping clone (invalid URL):', entry.storageUrl);
      continue;
    }
    const workflowId = await getOrCreateWorkflowId(entry.workflowUid, entry.variantKey, 'competitor_comparison');
    await db
      .insert(adClone)
      .values({
        workflowId,
        storageKey,
        storageUrl: entry.storageUrl,
      })
      .onConflictDoNothing({ target: [adClone.workflowId] });
  }

  console.log(
    'Ad workflow and ad_clone seed completed:',
    AD_CLONE_MEME_ENTRIES.length,
    'meme clones,',
    AD_CLONE_PS_ENTRIES.length,
    'problem-solution clones,',
    AD_CLONE_VALP_ENTRIES.length,
    'value-proposition clones,',
    AD_CLONE_TES_ENTRIES.length,
    'testimonial clones,',
    AD_CLONE_COMP_ENTRIES.length,
    'competitor-comparison clones.'
  );
}

async function seed() {
  try {
    console.log('🌱 Starting database seed...');

    // Create subscription and topup plans first
    await seedSubscriptionPlans();
    await seedTopupPlans();

    // Seed ad_archetype, then ad_workflow + ad_clone (all clone ads)
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

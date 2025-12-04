import { db } from './drizzle';
import { user, tokenAccount, tokenLedger, generationJob, adImage, subscriptionPlan, topupPlan, brand, brandInsights } from './schema/index';
import { TokenPeriod, JobStatus } from './schema/enums';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

async function createTestUser() {
  console.log('Creating test user...');
  
  const testUserId = crypto.randomUUID();
  
  // Create user
  const [newUser] = await db
    .insert(user)
    .values({
      id: testUserId,
      email: 'test@blumpo.com',
      displayName: 'Test User',
      photoUrl: null,
      phoneNumber: null,
    })
    .returning();

  console.log('Test user created:', newUser.email);

  // Create token account
  const [account] = await db
    .insert(tokenAccount)
    .values({
      userId: testUserId,
      balance: 100,
      planCode: 'FREE',
    })
    .returning();

  console.log('Token account created with balance:', account.balance);

  // Add initial token ledger entry
  await db
    .insert(tokenLedger)
    .values({
      userId: testUserId,
      delta: 100,
      reason: 'INITIAL_GRANT',
      referenceId: `seed_${testUserId}`,
      balanceAfter: 100,
    });

  console.log('Initial token grant recorded.');

  return newUser;
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
      tokensCost: 10,
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
      delta: -10,
      reason: 'GENERATION',
      referenceId: jobId,
      balanceAfter: 90,
    });

  // Update token account balance
  await db
    .update(tokenAccount)
    .set({ balance: 90 })
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
      archetypes: [], // Empty array for seed data
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
      displayName: 'Free',
      monthlyTokens: 50,
      description: ['50 tokens per month', 'Basic ad generation', 'Email support'],
      stripeProductId: null,
      isActive: true,
      isDefault: true,
      sortOrder: 1,
    },
    {
      planCode: 'STARTER',
      displayName: 'Starter',
      monthlyTokens: 300,
      description: ['300 tokens per month', 'All ad types', 'Priority support', 'Export options'],
      stripeProductId: process.env.STRIPE_STARTER_PRODUCT_ID || null,
      isActive: true,
      isDefault: false,
      sortOrder: 2,
    },
    {
      planCode: 'PRO',
      displayName: 'Pro',
      monthlyTokens: 1500,
      description: ['1,500 tokens per month', 'All ad types', '24/7 support', 'Advanced features', 'Team collaboration', 'Custom branding'],
      stripeProductId: process.env.STRIPE_GROWTH_PRODUCT_ID || null,
      isActive: true,
      isDefault: false,
      sortOrder: 3,
    },
    {
      planCode: 'TEAM',
      displayName: 'TEAM',
      monthlyTokens: 5000,
      description: ['5,000 tokens per month', 'All ad types', '24/7 support', 'Advanced features', 'Team collaboration', 'Custom branding', 'User management', 'Analytics dashboard'],
      stripeProductId: process.env.STRIPE_TEAM_PRODUCT_ID || null,
      isActive: true,
      isDefault: false,
      sortOrder: 4,
    }
  ];

  for (const plan of plans) {
    await db.insert(subscriptionPlan).values(plan).onConflictDoUpdate({
      target: subscriptionPlan.planCode,
      set: {
        displayName: plan.displayName,
        monthlyTokens: plan.monthlyTokens,
        description: plan.description,
        stripeProductId: plan.stripeProductId,
        isActive: plan.isActive,
        isDefault: plan.isDefault,
        sortOrder: plan.sortOrder,
        updatedAt: new Date(),
      },
    });
  }

  console.log('Subscription plans created/updated.');
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
    await db.insert(topupPlan).values(topup).onConflictDoUpdate({
      target: topupPlan.topupSku,
      set: {
        displayName: topup.displayName,
        tokensAmount: topup.tokensAmount,
        stripeProductId: topup.stripeProductId,
        isActive: topup.isActive,
        sortOrder: topup.sortOrder,
        updatedAt: new Date(),
      },
    });
  }

  console.log('Topup plans created/updated.');
}

async function seed() {
  try {
    console.log('🌱 Starting database seed...');

    // Create subscription and topup plans first
    await seedSubscriptionPlans();
    await seedTopupPlans();

    // Create test user with token account
    const testUser = await createTestUser();

    // Create a sample brand
    const sampleBrand = await createSampleBrand(testUser.id);

    // Create a sample generation job
    await createSampleGenerationJob(testUser.id, sampleBrand.id);

    console.log('✅ Database seed completed successfully!');
    console.log('\nTest credentials:');
    console.log('Email: test@blumpo.com');
    console.log('Initial token balance: 90 tokens');
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

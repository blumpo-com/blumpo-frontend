import { db } from './drizzle';
import { user, tokenAccount, tokenLedger, generationJob, assetImage } from './schema/index';
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

async function createSampleGenerationJob(userId: string) {
  console.log('Creating sample generation job...');
  
  const jobId = crypto.randomUUID();
  const imageId = crypto.randomUUID();
  
  // Create generation job
  const [job] = await db
    .insert(generationJob)
    .values({
      id: jobId,
      userId,
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

  // Create asset image
  await db
    .insert(assetImage)
    .values({
      id: imageId,
      jobId,
      userId,
      title: 'Beautiful Sunset Landscape',
      description: 'A stunning mountain landscape at sunset',
      storageKey: `users/${userId}/jobs/${jobId}/${imageId}.webp`,
      publicUrl: `https://cdn.blumpo.com/images/${imageId}.webp`,
      mimeType: 'image/webp',
      bytesSize: 524288, // 512KB
      width: 1024,
      height: 1024,
      format: 'WEBP',
      sha256: 'abcd1234567890abcd1234567890abcd1234567890abcd1234567890abcd1234',
      safetyFlags: [],
      isDeleted: false,
    });

  console.log('Sample asset created for job.');

  return job;
}

async function seed() {
  try {
    console.log('🌱 Starting database seed...');

    // Create test user with token account
    const testUser = await createTestUser();

    // Create a sample generation job
    await createSampleGenerationJob(testUser.id);

    console.log('✅ Database seed completed successfully!');
    console.log('\nTest credentials:');
    console.log('Email: test@blumpo.com');
    console.log('Initial token balance: 90 tokens');
    
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

import { desc, eq, sql } from 'drizzle-orm';
import { db } from '../drizzle';
import { generationJob, adImage } from '../schema/index';
import { appendTokenLedgerEntry } from './tokens';

// Generation job operations
export async function createGenerationJob(
  userId: string,
  jobData: {
    id: string;
    prompt?: string; // Now optional
    params: any;
    tokensCost: number;
    brandId?: string; // Optional (can be null for some jobs)
    productPhotoUrls?: string[]; // Array of product photo URLs
    productPhotoMode?: 'brand' | 'custom' | 'mixed'; // Photo mode
    archetypeCode?: string; // FK to ad_archetype
    archetypeMode?: 'single' | 'random'; // 'single' or 'random'
    formats?: string[]; // Array of formats
    format?: string; // Legacy single format
    selectedPainPoints?: string[]; // Array of selected pain points
    insightSource?: 'auto' | 'manual' | 'mixed'; // Insight source
    archetypeInputs?: any; // JSON object
  }
) {
  return await db.transaction(async (tx) => {
    // Deduct tokens first
    const ledgerEntry = await appendTokenLedgerEntry(
      userId,
      -jobData.tokensCost,
      'GENERATION',
      jobData.id
    );

    // Create generation job
    const job = await tx
      .insert(generationJob)
      .values({
        id: jobData.id,
        prompt: jobData.prompt || null,
        params: jobData.params,
        tokensCost: jobData.tokensCost,
        userId,
        brandId: jobData.brandId || null,
        productPhotoUrls: jobData.productPhotoUrls || [],
        productPhotoMode: jobData.productPhotoMode || 'brand',
        archetypeCode: jobData.archetypeCode || null,
        archetypeMode: jobData.archetypeMode || 'single',
        formats: jobData.formats || [],
        format: jobData.format || null,
        selectedPainPoints: jobData.selectedPainPoints || [],
        insightSource: jobData.insightSource || 'auto',
        archetypeInputs: jobData.archetypeInputs || {},
        ledgerId: ledgerEntry.id,
      })
      .returning();

    return job[0];
  });
}

export async function getGenerationJobById(jobId: string) {
  const result = await db
    .select()
    .from(generationJob)
    .where(eq(generationJob.id, jobId))
    .limit(1);
  return result[0] || null;
}

export async function getGenerationJobsForUser(userId: string, limit = 20) {
  return await db
    .select({
      job: generationJob,
      adImageCount: sql<number>`count(${adImage.id})::int`,
    })
    .from(generationJob)
    .leftJoin(adImage, eq(generationJob.id, adImage.jobId))
    .where(eq(generationJob.userId, userId))
    .groupBy(generationJob.id)
    .orderBy(desc(generationJob.createdAt))
    .limit(limit);
}

export async function updateGenerationJobStatus(
  jobId: string,
  status: 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELED',
  errorCode?: string,
  errorMessage?: string
) {
  const updates: any = {
    status,
    completedAt: new Date(),
  };

  if (status === 'RUNNING') {
    updates.startedAt = new Date();
    delete updates.completedAt;
  }

  if (errorCode) updates.errorCode = errorCode;
  if (errorMessage) updates.errorMessage = errorMessage;

  await db
    .update(generationJob)
    .set(updates)
    .where(eq(generationJob.id, jobId));
}
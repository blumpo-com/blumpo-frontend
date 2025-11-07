import { desc, eq, sql } from 'drizzle-orm';
import { db } from '../drizzle';
import { generationJob, assetImage } from '../schema/index';
import { appendTokenLedgerEntry } from './tokens';

// Generation job operations
export async function createGenerationJob(
  userId: string,
  jobData: {
    id: string;
    prompt: string;
    params: any;
    tokensCost: number;
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
        ...jobData,
        userId,
        ledgerId: ledgerEntry.id,
      })
      .returning();

    return job[0];
  });
}

export async function getGenerationJobsForUser(userId: string, limit = 20) {
  return await db
    .select({
      job: generationJob,
      assetCount: sql<number>`count(${assetImage.id})::int`,
    })
    .from(generationJob)
    .leftJoin(assetImage, eq(generationJob.id, assetImage.jobId))
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
import { desc, and, eq } from 'drizzle-orm';
import { db } from '../drizzle';
import { assetImage } from '../schema/index';

// Asset operations
export async function attachAssetToJob(
  jobId: string,
  userId: string,
  assetData: {
    id: string;
    title?: string;
    description?: string;
    storageKey: string;
    publicUrl?: string;
    mimeType: string;
    bytesSize: number;
    width: number;
    height: number;
    format: string;
    sha256?: string;
    safetyFlags?: any[];
  }
) {
  const asset = await db
    .insert(assetImage)
    .values({
      ...assetData,
      jobId,
      userId,
      safetyFlags: assetData.safetyFlags || [],
    })
    .returning();

  return asset[0];
}

export async function getAssetsForUser(userId: string, limit = 50) {
  return await db
    .select()
    .from(assetImage)
    .where(and(eq(assetImage.userId, userId), eq(assetImage.isDeleted, false)))
    .orderBy(desc(assetImage.createdAt))
    .limit(limit);
}
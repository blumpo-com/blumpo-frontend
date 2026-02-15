import { desc, eq, and, sql, inArray, ne, lte, isNotNull } from "drizzle-orm";
import { db } from "../drizzle";
import {
  adArchetype,
  adWorkflow,
  adClone,
  adImage,
  adEvent,
  generationJob,
  brand,
} from "../schema/index";
import { CONTENT_LIBRARY_DELETE_GRACE_DAYS } from "@/lib/constants/content-library";

// Ad archetype operations
export async function getAdArchetypes() {
  return await db.select().from(adArchetype).orderBy(adArchetype.displayName);
}

export async function getAdArchetypeByCode(code: string) {
  const result = await db
    .select()
    .from(adArchetype)
    .where(eq(adArchetype.code, code))
    .limit(1);
  return result[0] || null;
}

// Ad workflow operations
export async function getWorkflowsForArchetype(archetypeCode: string) {
  return await db
    .select()
    .from(adWorkflow)
    .where(
      and(
        eq(adWorkflow.archetypeCode, archetypeCode),
        eq(adWorkflow.isActive, true)
      )
    )
    .orderBy(adWorkflow.variantKey);
}

export async function getActiveWorkflows() {
  return await db
    .select()
    .from(adWorkflow)
    .where(eq(adWorkflow.isActive, true))
    .orderBy(adWorkflow.archetypeCode, adWorkflow.variantKey);
}

export async function getWorkflowById(workflowId: string) {
  const result = await db
    .select()
    .from(adWorkflow)
    .where(eq(adWorkflow.id, workflowId))
    .limit(1);
  return result[0] || null;
}

// Ad image operations
export async function saveGeneratedAdImages(
  jobId: string,
  userId: string,
  images: Array<{
    id: string;
    title?: string;
    storageKey: string;
    publicUrl?: string;
    bytesSize: number;
    width: number;
    height: number;
    format: string;
    workflowId?: string;
    brandId?: string;
    readyToDisplay?: boolean;
  }>
) {
  if (images.length === 0) return [];

  const adImages = await db
    .insert(adImage)
    .values(
      images.map((img) => ({
        id: img.id,
        jobId,
        userId,
        brandId: img.brandId || null,
        title: img.title || null,
        storageKey: img.storageKey,
        publicUrl: img.publicUrl || null,
        bytesSize: img.bytesSize,
        width: img.width,
        height: img.height,
        format: img.format,
        workflowId: img.workflowId || null,
        readyToDisplay: img.readyToDisplay || false,
      }))
    )
    .returning();

  return adImages;
}

export async function getUserAds(
  userId: string,
  options?: {
    brandId?: string;
    limit?: number;
    offset?: number;
    includeDeleted?: boolean;
  }
) {
  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  let conditions = [eq(adImage.userId, userId)];

  if (options?.brandId) {
    conditions.push(eq(adImage.brandId, options.brandId));
  }

  if (!options?.includeDeleted) {
    conditions.push(eq(adImage.isDeleted, false));
  }

  return await db
    .select({
      adImage,
      brand: {
        id: brand.id,
        name: brand.name,
        websiteUrl: brand.websiteUrl,
      },
      job: {
        id: generationJob.id,
        status: generationJob.status,
        archetypeCode: generationJob.archetypeCode,
        archetypeMode: generationJob.archetypeMode,
        createdAt: generationJob.createdAt,
      },
      workflow: {
        id: adWorkflow.id,
        archetypeCode: adWorkflow.archetypeCode,
        variantKey: adWorkflow.variantKey,
      },
    })
    .from(adImage)
    .leftJoin(brand, eq(adImage.brandId, brand.id))
    .leftJoin(generationJob, eq(adImage.jobId, generationJob.id))
    .leftJoin(adWorkflow, eq(adImage.workflowId, adWorkflow.id))
    .where(and(...conditions))
    .orderBy(desc(adImage.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getAdImageById(adImageId: string) {
  const result = await db
    .select()
    .from(adImage)
    .where(eq(adImage.id, adImageId))
    .limit(1);
  return result[0] || null;
}

export async function getAdImagesByJobId(jobId: string) {
  return await db
    .select()
    .from(adImage)
    .where(eq(adImage.jobId, jobId))
    .orderBy(desc(adImage.createdAt));
}

export async function markAdImageAsDeleted(adImageId: string, deleteAt?: Date) {
  const deleteAtDate =
    deleteAt ||
    new Date(Date.now() + CONTENT_LIBRARY_DELETE_GRACE_DAYS * 24 * 60 * 60 * 1000);
  await db
    .update(adImage)
    .set({
      isDeleted: true,
      deleteAt: deleteAtDate,
    })
    .where(eq(adImage.id, adImageId));
}

export async function markAdImagesAsDeleted(adImageIds: string[]) {
  if (adImageIds.length === 0) return;

  const deleteAtDate = new Date(
    Date.now() + CONTENT_LIBRARY_DELETE_GRACE_DAYS * 24 * 60 * 60 * 1000
  );
  await db
    .update(adImage)
    .set({
      isDeleted: true,
      deleteAt: deleteAtDate,
    })
    .where(inArray(adImage.id, adImageIds));
}

export async function restoreAdImage(adImageId: string) {
  await db
    .update(adImage)
    .set({
      isDeleted: false,
      deleteAt: null,
    })
    .where(eq(adImage.id, adImageId));
}

export async function getAdImagesEligibleForPermanentCleanup() {
  const now = new Date();
  return await db
    .select()
    .from(adImage)
    .where(
      and(
        eq(adImage.isDeleted, true),
        isNotNull(adImage.deleteAt),
        lte(adImage.deleteAt, now),
        eq(adImage.permanentlyDeleted, false)
      )
    );
}

export async function markAdImagesPermanentlyDeleted(adImageIds: string[]) {
  if (adImageIds.length === 0) return;
  await db
    .update(adImage)
    .set({ permanentlyDeleted: true, publicUrl: null })
    .where(inArray(adImage.id, adImageIds));
}

export async function banAdImage(adImageId: string) {
  await db
    .update(adImage)
    .set({
      banFlag: true,
    })
    .where(eq(adImage.id, adImageId));
}

// Ad event operations (analytics)
export async function logAdEvent(event: {
  userId?: string;
  brandId?: string;
  jobId?: string;
  adImageId?: string;
  archetypeCode?: string;
  workflowId?: string;
  eventType: string;
  eventSource?: string;
  metadata?: Record<string, any>;
}) {
  const result = await db
    .insert(adEvent)
    .values({
      userId: event.userId || null,
      brandId: event.brandId || null,
      jobId: event.jobId || null,
      adImageId: event.adImageId || null,
      archetypeCode: event.archetypeCode || null,
      workflowId: event.workflowId || null,
      eventType: event.eventType,
      eventSource: event.eventSource || null,
      metadata: event.metadata || {},
    })
    .returning();

  return result[0];
}

export async function getAdAnalyticsSummary(options?: {
  userId?: string;
  brandId?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  let conditions = [];

  if (options?.userId) {
    conditions.push(eq(adEvent.userId, options.userId));
  }

  if (options?.brandId) {
    conditions.push(eq(adEvent.brandId, options.brandId));
  }

  if (options?.startDate) {
    conditions.push(sql`${adEvent.createdAt} >= ${options.startDate}`);
  }

  if (options?.endDate) {
    conditions.push(sql`${adEvent.createdAt} <= ${options.endDate}`);
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Count events by type
  const eventsByType = await db
    .select({
      eventType: adEvent.eventType,
      count: sql<number>`count(*)::int`,
    })
    .from(adEvent)
    .where(whereClause)
    .groupBy(adEvent.eventType);

  // Count events by archetype
  const eventsByArchetype = await db
    .select({
      archetypeCode: adEvent.archetypeCode,
      count: sql<number>`count(*)::int`,
    })
    .from(adEvent)
    .where(
      and(whereClause || sql`1=1`, sql`${adEvent.archetypeCode} IS NOT NULL`)
    )
    .groupBy(adEvent.archetypeCode);

  // Count events by workflow
  const eventsByWorkflow = await db
    .select({
      workflowId: adEvent.workflowId,
      count: sql<number>`count(*)::int`,
    })
    .from(adEvent)
    .where(and(whereClause || sql`1=1`, sql`${adEvent.workflowId} IS NOT NULL`))
    .groupBy(adEvent.workflowId);

  return {
    eventsByType,
    eventsByArchetype,
    eventsByWorkflow,
  };
}

export async function getAdEventsForImage(adImageId: string, limit = 50) {
  return await db
    .select()
    .from(adEvent)
    .where(eq(adEvent.adImageId, adImageId))
    .orderBy(desc(adEvent.createdAt))
    .limit(limit);
}

export async function getAdEventsForJob(jobId: string, limit = 100) {
  return await db
    .select()
    .from(adEvent)
    .where(eq(adEvent.jobId, jobId))
    .orderBy(desc(adEvent.createdAt))
    .limit(limit);
}

// Get worklows and their archetypes by workflow ids
export async function getWorkflowsAndArchetypesByWorkflowIds(
  workflowIds: string[]
) {
  return await db
    .select()
    .from(adWorkflow)
    .where(inArray(adWorkflow.id, workflowIds))
    .leftJoin(adArchetype, eq(adWorkflow.archetypeCode, adArchetype.code));
}

/** Ad clones for meme archetype only (workflows with archetype_code = 'meme'). workflow_id is unique in ad_clone, so one row per workflow. */
export async function getMemeWorkflowsWithPreview() {
  return await db
    .select({
      workflowId: adWorkflow.id,
      variantKey: adWorkflow.variantKey,
      storageUrl: adClone.storageUrl,
    })
    .from(adClone)
    .innerJoin(adWorkflow, eq(adClone.workflowId, adWorkflow.id))
    .where(
      and(
        eq(adWorkflow.archetypeCode, "meme"),
        eq(adWorkflow.isActive, true)
      )
    )
    .orderBy(adWorkflow.variantKey);
}
// Quick ads operations
export async function getQuickAdsForFormat(
  userId: string,
  brandId: string | null,
  format: '1:1' | '9:16',
  limit: number = 5
) {
  // Format is already in database format (1:1 or 9:16)
  const formatValue = format;
  
  const results = await db
    .select({
      ad_image: adImage,
      generation_job: generationJob,
    })
    .from(adImage)
    .innerJoin(generationJob, eq(adImage.jobId, generationJob.id))
    .where(
      and(
        eq(adImage.userId, userId),
        brandId ? eq(adImage.brandId, brandId) : sql`${adImage.brandId} IS NULL`,
        eq(adImage.format, formatValue),
        eq(adImage.readyToDisplay, false),
        eq(adImage.isDeleted, false),
        eq(generationJob.autoGenerated, true),
        eq(generationJob.status, 'SUCCEEDED')
      )
    )
    .orderBy(desc(adImage.createdAt))
    .limit(limit);
  
  return results;
}

export async function markAdsAsReadyToDisplay(adImageIds: string[]) {
  if (adImageIds.length === 0) return;
  
  await db
    .update(adImage)
    .set({
      readyToDisplay: true,
    })
    .where(inArray(adImage.id, adImageIds));
}

export async function getQuickAdsCountByFormat(
  userId: string,
  brandId: string | null,
  format: '1:1' | '9:16'
) {
  // Format is already in database format (1:1 or 9:16)
  const formatValue = format;
  
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(adImage)
    .innerJoin(generationJob, eq(adImage.jobId, generationJob.id))
    .where(
      and(
        eq(adImage.userId, userId),
        brandId ? eq(adImage.brandId, brandId) : sql`${adImage.brandId} IS NULL`,
        eq(adImage.format, formatValue),
        eq(adImage.readyToDisplay, false),
        eq(adImage.isDeleted, false),
        eq(generationJob.autoGenerated, true),
        eq(generationJob.status, 'SUCCEEDED')
      )
    );
  
  return result[0]?.count || 0;
}

export async function getUnusedFormatAds(
  jobId: string,
  selectedFormat: '1:1' | '9:16'
) {
  // Get all ads from the job that are NOT in the selected format
  // Format is already in database format (1:1 or 9:16)
  const formatValue = selectedFormat;
  
  return await db
    .select()
    .from(adImage)
    .where(
      and(
        eq(adImage.jobId, jobId),
        ne(adImage.format, formatValue),
        eq(adImage.isDeleted, false)
      )
    );
}

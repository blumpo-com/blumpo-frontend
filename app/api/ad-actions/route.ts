import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { markAdImagesAsDeleted, getAdImageById, getAdImagesByJobId } from '@/lib/db/queries/ads';
import { logAdEvent } from '@/lib/db/queries/ads';

// Handle batch ad actions (delete, save to library)
export async function POST(req: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { jobId, deletedIds, savedIds, downloadedIds } = body;

    if (!jobId) {
      return NextResponse.json({ error: 'jobId required' }, { status: 400 });
    }

    // Get all ad images for this job to get metadata
    const allAdImages = await getAdImagesByJobId(jobId);
    const adImageMap = new Map(allAdImages.map(img => [img.id, img]));

    // Mark deleted images
    if (deletedIds && deletedIds.length > 0) {
      await markAdImagesAsDeleted(deletedIds);
      
      // Log delete events
      for (const adImageId of deletedIds) {
        const adImage = adImageMap.get(adImageId);
        if (adImage) {
          await logAdEvent({
            userId: user.id,
            brandId: adImage.brandId || undefined,
            jobId: adImage.jobId,
            adImageId: adImage.id,
            workflowId: adImage.workflowId || undefined,
            eventType: 'deleted',
            eventSource: 'ui',
            metadata: {},
          });
        }
      }
    }

    // Log saved events (added to library)
    if (savedIds && savedIds.length > 0) {
      for (const adImageId of savedIds) {
        const adImage = adImageMap.get(adImageId);
        if (adImage) {
          await logAdEvent({
            userId: user.id,
            brandId: adImage.brandId || undefined,
            jobId: adImage.jobId,
            adImageId: adImage.id,
            workflowId: adImage.workflowId || undefined,
            eventType: 'saved',
            eventSource: 'ui',
            metadata: {},
          });
        }
      }
    }

    // Log downloaded events
    if (downloadedIds && downloadedIds.length > 0) {
      for (const adImageId of downloadedIds) {
        const adImage = adImageMap.get(adImageId);
        if (adImage) {
          await logAdEvent({
            userId: user.id,
            brandId: adImage.brandId || undefined,
            jobId: adImage.jobId,
            adImageId: adImage.id,
            workflowId: adImage.workflowId || undefined,
            eventType: 'downloaded',
            eventSource: 'ui',
            metadata: {},
          });
        }
      }
    }

    // TODO: Delete images from Vercel blob storage for deletedIds
    // This would require:
    // 1. Getting storageKey from adImage records
    // 2. Using @vercel/blob del() function to delete from blob storage
    // Example:
    // import { del } from '@vercel/blob';
    // for (const adImageId of deletedIds) {
    //   const adImage = adImageMap.get(adImageId);
    //   if (adImage?.storageKey) {
    //     await del(adImage.storageKey);
    //   }
    // }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing ad actions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


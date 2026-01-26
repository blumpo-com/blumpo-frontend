import { NextResponse } from "next/server";
import { getUser } from "@/lib/db/queries";
import { markAdsAsReadyToDisplay, getUnusedFormatAds } from "@/lib/db/queries/ads";
import { getAdImagesByJobId } from "@/lib/db/queries/ads";
import { del } from "@vercel/blob";
import { extractBlobPathFromUrl } from "@/lib/blob-utils";
import { markAdImagesAsDeleted } from "@/lib/db/queries/ads";
import { getGenerationJobById } from "@/lib/db/queries/generation";

// Mark ads as displayed and cleanup unused formats
export async function POST(req: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { jobId, format } = body; // format: '1:1' or '16:9'

    if (!jobId || !format) {
      return NextResponse.json({ error: "jobId and format required" }, { status: 400 });
    }

    // Get generation job to check if it's auto-generated and if tokens were already deducted
    const job = await getGenerationJobById(jobId);
    if (!job) {
      return NextResponse.json({ error: "Generation job not found" }, { status: 404 });
    }

    // Verify job belongs to user
    if (job.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get all ads from this job
    const allAds = await getAdImagesByJobId(jobId);
    
    // Filter ads in the selected format
    const selectedFormatAds = allAds.filter(ad => ad.format === format);
    
    if (selectedFormatAds.length === 0) {
      return NextResponse.json({ error: "No ads found for selected format" }, { status: 404 });
    }

    // Mark selected format ads as ready to display
    const adIds = selectedFormatAds.map(ad => ad.id);
    await markAdsAsReadyToDisplay(adIds);

    // Get unused format ads (ads not in selected format)
    const unusedAds = await getUnusedFormatAds(jobId, format as '1:1' | '16:9');
    
    // Delete unused ads from Vercel Blob and mark as deleted in DB
    const deletePromises = unusedAds.map(async (ad) => {
      try {
        let blobPath: string | null = null;
        
        // Try to extract blob path from publicUrl first
        if (ad.publicUrl) {
          blobPath = extractBlobPathFromUrl(ad.publicUrl);
        }
        
        // Fallback to storageKey if publicUrl extraction failed
        if (!blobPath && ad.storageKey) {
          blobPath = ad.storageKey;
        }
        
        // Delete from Vercel Blob if we have a valid path
        if (blobPath) {
          await del(blobPath);
        } else {
          console.warn(`[QUICK-ADS] No blob path found for ad ${ad.id} (publicUrl: ${ad.publicUrl}, storageKey: ${ad.storageKey})`);
        }
      } catch (error) {
        console.error(`[QUICK-ADS] Error deleting blob for ad ${ad.id}:`, error);
      }
    });

    await Promise.all(deletePromises);
    
    // Mark unused ads as deleted in database
    const unusedAdIds = unusedAds.map(ad => ad.id);
    if (unusedAdIds.length > 0) {
      await markAdImagesAsDeleted(unusedAdIds);
    }

    return NextResponse.json({
      success: true,
      markedAsDisplayed: adIds.length,
      deleted: unusedAdIds.length,
    });
  } catch (error) {
    console.error('[QUICK-ADS] Error marking ads as displayed:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


import { NextResponse } from "next/server";
import { getUser } from "@/lib/db/queries";
import { markAdsAsReadyToDisplay, getUnusedFormatAds } from "@/lib/db/queries/ads";
import { getAdImagesByJobId } from "@/lib/db/queries/ads";
import { del } from "@vercel/blob";
import { extractBlobPathFromUrl } from "@/lib/blob-utils";
import { markAdImagesAsDeleted } from "@/lib/db/queries/ads";

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
      if (ad.publicUrl) {
        try {
          const blobPath = extractBlobPathFromUrl(ad.publicUrl);
          if (blobPath) {
            await del(blobPath);
          }
        } catch (error) {
          console.error(`[QUICK-ADS] Error deleting blob for ad ${ad.id}:`, error);
        }
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


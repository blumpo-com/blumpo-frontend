import { NextRequest, NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { extractBlobPathFromUrl } from "@/lib/blob-utils";
import {
  getAdImagesEligibleForPermanentCleanup,
  markAdImagesPermanentlyDeleted,
} from "@/lib/db/queries/ads";

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("Authorization");
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
  if (authHeader && authHeader === expectedAuth) return true;
  if (request.headers.get("user-agent") === "vercel-cron/1.0") return true;
  return false;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return runCleanupJob();
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return runCleanupJob();
}

async function runCleanupJob() {
  const startTime = Date.now();
  let processedCount = 0;
  let blobErrorCount = 0;
  let skippedNoBlobCount = 0;

  console.log("[cleanup-deleted-ads] Starting cleanup job...");

  try {
    const eligible = await getAdImagesEligibleForPermanentCleanup();
    console.log(`[cleanup-deleted-ads] Found ${eligible.length} ads eligible for permanent cleanup`);

    const idsToMark: string[] = [];

    for (const ad of eligible) {
      console.log(`[cleanup-deleted-ads] Processing ad ${ad.id} (deleteAt: ${ad.deleteAt?.toISOString()})`);

      let blobPath: string | null = null;
      if (ad.publicUrl) {
        blobPath = extractBlobPathFromUrl(ad.publicUrl);
      }
      if (!blobPath && ad.storageKey) {
        blobPath = ad.storageKey;
      }

      if (blobPath) {
        try {
          await del(blobPath);
          console.log(`[cleanup-deleted-ads] Deleted blob for ad ${ad.id}: ${blobPath}`);
        } catch (error) {
          console.error(`[cleanup-deleted-ads] Error deleting blob for ad ${ad.id} (path: ${blobPath}):`, error);
          blobErrorCount++;
        }
      } else {
        console.warn(`[cleanup-deleted-ads] No blob path found for ad ${ad.id}, skipping blob deletion`);
        skippedNoBlobCount++;
      }

      idsToMark.push(ad.id);
      processedCount++;
    }

    if (idsToMark.length > 0) {
      await markAdImagesPermanentlyDeleted(idsToMark);
      console.log(`[cleanup-deleted-ads] Marked ${idsToMark.length} ads as permanently deleted`);
    }

    const duration = Date.now() - startTime;
    const result = {
      processed: processedCount,
      blobErrors: blobErrorCount,
      skippedNoBlob: skippedNoBlobCount,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    };

    console.log("[cleanup-deleted-ads] Job completed:", result);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[cleanup-deleted-ads] Job failed:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        processed: processedCount,
        blobErrors: blobErrorCount,
      },
      { status: 500 }
    );
  }
}

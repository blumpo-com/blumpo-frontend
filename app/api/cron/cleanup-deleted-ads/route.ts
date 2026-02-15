import { NextRequest, NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { extractBlobPathFromUrl } from "@/lib/blob-utils";
import {
  getAdImagesEligibleForPermanentCleanup,
  markAdImagesPermanentlyDeleted,
} from "@/lib/db/queries/ads";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

  if (!authHeader || authHeader !== expectedAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let processedCount = 0;
  let blobErrorCount = 0;

  try {
    const eligible = await getAdImagesEligibleForPermanentCleanup();
    const idsToMark: string[] = [];

    for (const ad of eligible) {
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
        } catch (error) {
          console.error(
            `[cleanup-deleted-ads] Error deleting blob for ad ${ad.id}:`,
            error
          );
          blobErrorCount++;
        }
      }
      idsToMark.push(ad.id);
      processedCount++;
    }

    if (idsToMark.length > 0) {
      await markAdImagesPermanentlyDeleted(idsToMark);
    }

    return NextResponse.json({
      processed: processedCount,
      blobErrors: blobErrorCount,
    });
  } catch (error) {
    console.error("[cleanup-deleted-ads] Job failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

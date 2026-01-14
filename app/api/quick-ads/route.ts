import { NextResponse } from "next/server";
import { getUser } from "@/lib/db/queries";
import { getQuickAdsForFormat, getQuickAdsCountByFormat } from "@/lib/db/queries/ads";
import { getBrandById } from "@/lib/db/queries/brand";

// Check if user has 5 ads ready for a format
export async function GET(req: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format'); // '1:1' or '16:9'
    const brandId = searchParams.get('brandId');

    if (!format) {
      return NextResponse.json({ error: "Format required" }, { status: 400 });
    }

    // Format is already in database format (1:1 or 16:9)
    const dbFormat = format === '1:1' ? '1:1' : '16:9';
    
    // Verify brand belongs to user if provided
    let verifiedBrandId = null;
    if (brandId) {
      const brand = await getBrandById(brandId);
      if (!brand || brand.userId !== user.id) {
        return NextResponse.json({ error: "Brand not found" }, { status: 404 });
      }
      verifiedBrandId = brandId;
    }

    // Check if we have 5 ads ready
    const ads = await getQuickAdsForFormat(user.id, verifiedBrandId, dbFormat, 5);
    
    if (ads.length >= 5) {
      // Extract ad_image and generation_job from joined result
      const adImages = ads.map((row) => {
        const adImage = row.ad_image;
        const job = row.generation_job;
        
        return {
          id: adImage.id,
          publicUrl: adImage.publicUrl,
          width: adImage.width,
          height: adImage.height,
          format: adImage.format,
          jobId: adImage.jobId,
        };
      });
      
      // Get unique job IDs from the ads
      const jobIds = [...new Set(adImages.map(ad => ad.jobId))];
      
      return NextResponse.json({
        hasAds: true,
        ads: adImages,
        jobIds: jobIds,
      });
    }

    return NextResponse.json({
      hasAds: false,
      count: ads.length,
    });
  } catch (error) {
    console.error('[QUICK-ADS] Error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


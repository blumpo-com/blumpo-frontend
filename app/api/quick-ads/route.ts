import { NextResponse } from "next/server";
import { getUser } from "@/lib/db/queries";
import { getQuickAdsForFormat, getQuickAdsCountByFormat } from "@/lib/db/queries/ads";
import { getBrandById } from "@/lib/db/queries/brand";

// Check if user has 5 ads ready for a format (or both formats if mixed)
export async function GET(req: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format'); // '1:1', '9:16', or '1:1,9:16' for mixed
    const brandId = searchParams.get('brandId');

    if (!format) {
      return NextResponse.json({ error: "Format required" }, { status: 400 });
    }

    // Verify brand belongs to user if provided
    let verifiedBrandId = null;
    if (brandId) {
      const brand = await getBrandById(brandId);
      if (!brand || brand.userId !== user.id) {
        return NextResponse.json({ error: "Brand not found" }, { status: 404 });
      }
      verifiedBrandId = brandId;
    }

    // Check if format is mixed (contains comma or is '1:1-9:16')
    const isMixedFormat = format.includes(',') || format === '1:1-9:16';
    
    if (isMixedFormat) {
      // Check both formats
      const format1x1 = '1:1';
      const format9x16 = '9:16';
      
      const [ads1x1, ads9x16] = await Promise.all([
        getQuickAdsForFormat(user.id, verifiedBrandId, format1x1, 5),
        getQuickAdsForFormat(user.id, verifiedBrandId, format9x16, 5),
      ]);

      const hasBothFormats = ads1x1.length >= 5 && ads9x16.length >= 5;

      if (hasBothFormats) {
        // Extract ad images from both formats
        const adImages1x1 = ads1x1.map((row) => ({
          id: row.ad_image.id,
          publicUrl: row.ad_image.publicUrl,
          width: row.ad_image.width,
          height: row.ad_image.height,
          format: row.ad_image.format,
          jobId: row.ad_image.jobId,
        }));

        const adImages9x16 = ads9x16.map((row) => ({
          id: row.ad_image.id,
          publicUrl: row.ad_image.publicUrl,
          width: row.ad_image.width,
          height: row.ad_image.height,
          format: row.ad_image.format,
          jobId: row.ad_image.jobId,
        }));

        // Combine all ads
        const allAdImages = [...adImages1x1, ...adImages9x16];
        
        // Get unique job IDs from the ads
        const jobIds = [...new Set(allAdImages.map(ad => ad.jobId))];
        
        return NextResponse.json({
          hasAds: true,
          ads: allAdImages,
          jobIds: jobIds,
          format1x1: {
            hasAds: true,
            count: ads1x1.length,
            ads: adImages1x1,
          },
          format9x16: {
            hasAds: true,
            count: ads9x16.length,
            ads: adImages9x16,
          },
        });
      }

      // Return partial results if only one format has enough ads
      return NextResponse.json({
        hasAds: false,
        format1x1: {
          hasAds: ads1x1.length >= 5,
          count: ads1x1.length,
        },
        format9x16: {
          hasAds: ads9x16.length >= 5,
          count: ads9x16.length,
        },
      });
    }

    // Single format check (original logic)
    const dbFormat = format === '1:1' ? '1:1' : '9:16';
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


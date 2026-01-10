import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { getUserAds } from '@/lib/db/queries/ads';

/**
 * GET /api/content-library?brandId=xxx
 * Fetches all adImages for the authenticated user, optionally filtered by brandId
 */
export async function GET(req: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get('brandId');
    const archetypeCode = searchParams.get('archetype');
    const format = searchParams.get('format');
    const includeUnsaved = searchParams.get('unsaved') === 'true';
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Fetch all images for the user, optionally filtered by brandId
    const adImages = await getUserAds(user.id, {
      brandId: brandId || undefined,
      limit,
      offset,
      includeDeleted: false, // Don't show deleted images
    });

    // Filter out images with errors and without publicUrl
    let validImages = adImages
      .filter((item) => !item.adImage.errorFlag && item.adImage.publicUrl)
      .map((item) => ({
        id: item.adImage.id,
        title: item.adImage.title,
        publicUrl: item.adImage.publicUrl,
        width: item.adImage.width,
        height: item.adImage.height,
        format: item.adImage.format,
        createdAt: item.adImage.createdAt,
        brand: item.brand,
        job: item.job,
      }));

    // Filter by archetype
    if (archetypeCode && archetypeCode !== 'all') {
      validImages = validImages.filter(
        (img) => img.job?.archetypeCode === archetypeCode
      );
    }

    // Filter by format (aspect ratio)
    if (format && format !== 'all') {
      validImages = validImages.filter((img) => {
        const aspectRatio = img.width / img.height;
        if (format === '1:1') return Math.abs(aspectRatio - 1) < 0.1;
        if (format === '16:9') return Math.abs(aspectRatio - 16/9) < 0.1;
        return true;
      });
    }

    // Filter unsaved ads (images without brandId)
    if (includeUnsaved) {
      validImages = validImages.filter((img) => !img.brand?.id);
    }

    return NextResponse.json({
      images: validImages,
      total: validImages.length,
    });
  } catch (error) {
    console.error('Error getting content library:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

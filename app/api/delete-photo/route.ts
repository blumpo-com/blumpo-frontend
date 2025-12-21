import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { updateBrand, getBrandById } from '@/lib/db/queries/brand';
import { del } from '@vercel/blob';
import { extractBlobPathFromUrl } from '@/lib/blob-utils';

export async function DELETE(req: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const photoUrl = searchParams.get('url');
    const brandId = searchParams.get('brandId');
    const type = searchParams.get('type') || 'product'; // 'product', 'hero', or 'logo'

    if (!photoUrl) {
      return NextResponse.json({ error: 'Photo URL required' }, { status: 400 });
    }

    if (!brandId) {
      return NextResponse.json({ error: 'Brand ID required' }, { status: 400 });
    }

    // Verify brand belongs to user
    const brand = await getBrandById(brandId);
    if (!brand || brand.userId !== user.id) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // Extract blob path from URL
    const blobPath = extractBlobPathFromUrl(photoUrl);
    if (!blobPath) {
      return NextResponse.json({ error: 'Invalid photo URL' }, { status: 400 });
    }

    // Delete from Vercel Blob
    await del(blobPath);

    // Update brand data based on type
    if (type === 'logo') {
      await updateBrand(brandId, {
        logoUrl: null,
      });
    } else if (type === 'hero') {
      const currentHeroPhotos = brand.heroPhotos || [];
      const updatedHeroPhotos = currentHeroPhotos.filter((url) => url !== photoUrl);
      await updateBrand(brandId, {
        heroPhotos: updatedHeroPhotos,
      });
    } else {
      // Product photos (default)
      const currentPhotos = brand.photos || [];
      const updatedPhotos = currentPhotos.filter((url) => url !== photoUrl);
      await updateBrand(brandId, {
        photos: updatedPhotos,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting photo:', error);
    return NextResponse.json(
      { error: 'Failed to delete photo' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { updateBrand, getBrandById } from '@/lib/db/queries/brand';
// Note: Install @vercel/blob package: pnpm add @vercel/blob
import { put } from '@vercel/blob';

export async function POST(req: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const brandId = formData.get('brandId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!brandId) {
      return NextResponse.json({ error: 'Brand ID required' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
    }

    // Verify brand belongs to user
    const brand = await getBrandById(brandId);
    if (!brand || brand.userId !== user.id) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop() || 'jpg';
    const filename = `${timestamp}-${randomStr}.${extension}`;
    
    // Upload to Vercel Blob at brand-assets path
    const path = `brand-assets/${brandId}/photos/${filename}`;

    const blob = await put(path, file, {
      access: 'public',
      contentType: file.type,
    });

    // Add photo URL to brand's photos array
    const currentPhotos = brand.photos || [];
    const updatedPhotos = [...currentPhotos, blob.url];
    
    await updateBrand(brandId, {
      photos: updatedPhotos,
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error('Error uploading photo:', error);
    return NextResponse.json(
      { error: 'Failed to upload photo' },
      { status: 500 }
    );
  }
}


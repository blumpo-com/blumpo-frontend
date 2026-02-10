import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { getAdImagesByJobId } from '@/lib/db/queries/ads';

// Get ad images by job ID
export async function GET(req: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({ error: 'jobId required' }, { status: 400 });
    }

    const adImages = await getAdImagesByJobId(jobId);
    
    // Filter out deleted and error images
    const validImages = adImages.filter(
      (img) => !img.errorFlag && img.publicUrl
    );

    return NextResponse.json(validImages);
  } catch (error) {
    console.error('Error getting ad images:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { getGenerationJobById, markGenerationJobAsViewed } from '@/lib/db/queries/generation';

// Mark generation job as viewed
export async function POST(
  req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = await params;

    const job = await getGenerationJobById(jobId);
    if (!job || job.userId !== user.id) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    await markGenerationJobAsViewed(jobId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking job as viewed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { updateGenerationJob, getGenerationJobById, deleteGenerationJob, hardDeleteGenerationJob } from '@/lib/db/queries/generation';
import { db } from '@/lib/db/drizzle';
import { generationJob } from '@/lib/db/schema';
import { randomUUID } from 'crypto';

// Create or get generation job
export async function POST(req: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      jobId, 
      brandId, 
      productPhotoUrls, 
      productPhotoMode, 
      archetypeCode, 
      archetypeMode, 
      formats,
      selectedInsights,
      insightSource,
      promotionValueInsight,
      archetypeInputs
    } = body;

    // If jobId provided, update existing job
    if (jobId) {
      const existingJob = await getGenerationJobById(jobId);
      if (!existingJob || existingJob.userId !== user.id) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }

      const updated = await updateGenerationJob(jobId, {
        productPhotoUrls,
        productPhotoMode,
        archetypeCode,
        archetypeMode,
        formats,
        selectedInsights,
        insightSource,
        promotionValueInsight,
        archetypeInputs,
      });

      return NextResponse.json(updated);
    }

    // Create new job (without token deduction - we'll do that on final submission)
    const newJobId = randomUUID();
    const job = await db
      .insert(generationJob)
      .values({
        id: newJobId,
        userId: user.id,
        brandId: brandId || null,
        productPhotoUrls: productPhotoUrls || [],
        productPhotoMode: productPhotoMode || 'brand',
        archetypeCode: archetypeCode || null,
        archetypeMode: archetypeMode || 'single',
        formats: formats || [],
        selectedInsights: selectedInsights || [],
        insightSource: insightSource || 'auto',
        promotionValueInsight: promotionValueInsight || {},
        archetypeInputs: archetypeInputs || {},
        params: {},
        tokensCost: 0, // Will be set on final submission
        status: 'QUEUED',
      })
      .returning();

    return NextResponse.json(job[0]);
  } catch (error) {
    console.error('Error in generation job API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get generation job
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

    const job = await getGenerationJobById(jobId);
    if (!job || job.userId !== user.id) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error('Error getting generation job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete generation job
export async function DELETE(req: Request) {
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

    const job = await getGenerationJobById(jobId);
    if (!job || job.userId !== user.id) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    // Hard delete for FAILED/CANCELED so user can regenerate (create new job with same URL)
    if (job.status === 'FAILED' || job.status === 'CANCELED') {
      await hardDeleteGenerationJob(jobId);
    } else {
      await deleteGenerationJob(jobId);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting generation job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


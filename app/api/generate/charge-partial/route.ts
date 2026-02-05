import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { getGenerationJobById } from '@/lib/db/queries/generation';
import { revertTokenRefund } from '@/lib/db/queries/subscription';

const TOKENS_COST_PER_GENERATION = 50;

export async function POST(req: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = await req.json();
    if (!jobId || typeof jobId !== 'string') {
      return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
    }

    const job = await getGenerationJobById(jobId);
    if (!job || job.userId !== user.id) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.status !== 'FAILED' && job.status !== 'CANCELED') {
      return NextResponse.json(
        { error: 'Job must be failed or canceled to revert refund for partial images' },
        { status: 400 }
      );
    }

    await revertTokenRefund(user.id, TOKENS_COST_PER_GENERATION, jobId);

    return NextResponse.json({
      success: true,
      tokens_deducted: TOKENS_COST_PER_GENERATION,
    });
  } catch (e) {
    console.error('[CHARGE-PARTIAL] Error:', e);
    const message = e instanceof Error ? e.message : 'Unknown error';
    const isInsufficient = message.toLowerCase().includes('insufficient');
    return NextResponse.json(
      {
        error: message,
        error_code: isInsufficient ? 'INSUFFICIENT_TOKENS' : null,
      },
      { status: isInsufficient ? 402 : 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { updateCancellationReasons } from '@/lib/db/queries/tokens';

const REASONS = [
  'Too expensive',
  'Hard to use',
  'Limited features',
  'Low quality ads',
  'Prefer other solution',
  'Other',
] as const;

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const reasons = Array.isArray(body?.reasons) ? body.reasons : [];

    const valid = reasons.filter((r: unknown) =>
      typeof r === 'string' && (REASONS as readonly string[]).includes(r)
    );

    if (valid.length > 0) {
      await updateCancellationReasons(user.id, valid);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}

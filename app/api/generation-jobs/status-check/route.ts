import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { checkJobStatuses } from '@/lib/api/redis-status-checker';

// Check Redis keys for job completion status (NO database queries)
export async function POST(req: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { jobIds } = body;

    if (!Array.isArray(jobIds) || jobIds.length === 0) {
      return NextResponse.json({ error: 'jobIds array required' }, { status: 400 });
    }

    // Check Redis keys for each jobId
    const statuses = await checkJobStatuses(jobIds);

    return NextResponse.json(statuses);
  } catch (error) {
    console.error('Error checking job statuses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/auth/admin';
import { getAllJobs } from '@/lib/db/queries/admin';
import { JobStatus } from '@/lib/db/schema/enums';

export async function GET(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const status = searchParams.get('status') as JobStatus | null;
  const userId = searchParams.get('userId') || undefined;
  const brandId = searchParams.get('brandId') || undefined;
  const dateFrom = searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined;
  const dateTo = searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined;

  const result = await getAllJobs({
    page,
    limit,
    filters: {
      status: status || undefined,
      userId,
      brandId,
      dateFrom,
      dateTo,
    },
  });

  return NextResponse.json(result);
}

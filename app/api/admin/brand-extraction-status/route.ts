import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/auth/admin';
import { getBrandExtractionStatusList } from '@/lib/db/queries/admin';

export async function GET(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const problemsOnly = searchParams.get('problemsOnly') === 'true';

  const result = await getBrandExtractionStatusList({
    page,
    limit,
    problemsOnly,
  });

  return NextResponse.json(result);
}

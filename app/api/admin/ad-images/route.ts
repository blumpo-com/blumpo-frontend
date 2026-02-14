import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/auth/admin';
import { getAllAdImages } from '@/lib/db/queries/admin';

export async function GET(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const userId = searchParams.get('userId') || undefined;
  const brandId = searchParams.get('brandId') || undefined;
  const jobId = searchParams.get('jobId') || undefined;

  const result = await getAllAdImages({
    page,
    limit,
    userId,
    brandId,
    jobId,
  });

  return NextResponse.json(result);
}

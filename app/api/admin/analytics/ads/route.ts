import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/auth/admin';
import {
  getArchetypeJobCounts,
  getArchetypeImageCounts,
  getWorkflowImageCounts,
  getArchetypeActionCounts,
  getWorkflowActionCounts,
  getTopUsersByActions,
  getActionConversionRates,
  getRecentAdActivity,
} from '@/lib/db/queries/admin';
import { toEndOfDay } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const dateFrom = searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined;
  const dateTo = searchParams.get('dateTo') ? toEndOfDay(new Date(searchParams.get('dateTo')!)) : undefined;
  const userId = searchParams.get('userId') ?? undefined;
  const brandId = searchParams.get('brandId') ?? undefined;
  const dateFilter = dateFrom && dateTo ? { dateFrom, dateTo } : {};
  const filter = { ...dateFilter, userId, brandId };

  const [
    archetypeJobs,
    archetypeImages,
    workflowImages,
    archetypeActions,
    workflowActions,
    topUsers,
    conversionRates,
    recentActivity,
  ] = await Promise.all([
    getArchetypeJobCounts(filter),
    getArchetypeImageCounts(filter),
    getWorkflowImageCounts(filter),
    getArchetypeActionCounts(filter),
    getWorkflowActionCounts(filter),
    getTopUsersByActions(10, { excludeAdminUsers: true, ...filter }),
    getActionConversionRates({ excludeAdminUsers: true, ...filter }),
    getRecentAdActivity(50, { excludeAdminUsers: true, ...filter }),
  ]);

  return NextResponse.json({
    archetypeJobs,
    archetypeImages,
    workflowImages,
    archetypeActions,
    workflowActions,
    topUsers,
    conversionRates,
    recentActivity,
  });
}

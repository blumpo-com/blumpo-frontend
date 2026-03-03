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
  const dateFilter = dateFrom && dateTo ? { dateFrom, dateTo } : {};

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
    getArchetypeJobCounts(dateFilter),
    getArchetypeImageCounts(dateFilter),
    getWorkflowImageCounts(dateFilter),
    getArchetypeActionCounts(dateFilter),
    getWorkflowActionCounts(dateFilter),
    getTopUsersByActions(10, { excludeAdminUsers: true, ...dateFilter }),
    getActionConversionRates({ excludeAdminUsers: true, ...dateFilter }),
    getRecentAdActivity(50, { excludeAdminUsers: true, ...dateFilter }),
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

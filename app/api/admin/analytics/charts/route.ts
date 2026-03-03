import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/auth/admin';
import {
  getUserGrowthData,
  getTokenUsageData,
  getJobStatusDistribution,
  getJobsOverTime,
  getSubscriptionDistribution,
  getRecentActivity,
} from '@/lib/db/queries/admin';
import { toEndOfDay } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const days = parseInt(searchParams.get('days') || '30');
  const dateFromParam = searchParams.get('dateFrom');
  const dateToParam = searchParams.get('dateTo');
  const dateFrom = dateFromParam ? new Date(dateFromParam) : undefined;
  const dateTo = dateToParam ? toEndOfDay(new Date(dateToParam)) : undefined;
  const chartOptions = {
    excludeAdminUsers: true as const,
    ...(dateFrom && dateTo ? { dateFrom, dateTo } : {}),
  };

  try {
    const [
      userGrowth,
      tokenUsage,
      jobStatus,
      jobsOverTime,
      subscriptionDistribution,
      recentActivity,
    ] = await Promise.all([
      getUserGrowthData(days, chartOptions),
      getTokenUsageData(days, chartOptions),
      getJobStatusDistribution(chartOptions),
      getJobsOverTime(days, chartOptions),
      getSubscriptionDistribution({ excludeAdminUsers: true }),
      getRecentActivity(15, { excludeAdminUsers: true }),
    ]);

    // Convert Date objects to ISO strings for JSON serialization
    const serializedActivity = recentActivity.map(item => ({
      ...item,
      timestamp: item.timestamp instanceof Date ? item.timestamp.toISOString() : item.timestamp,
    }));

    return NextResponse.json({
      userGrowth,
      tokenUsage,
      jobStatus,
      jobsOverTime,
      subscriptionDistribution,
      recentActivity: serializedActivity,
    });
  } catch (error) {
    console.error('Error fetching chart data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

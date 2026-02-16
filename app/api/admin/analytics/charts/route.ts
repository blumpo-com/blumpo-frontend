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

export async function GET(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const days = parseInt(searchParams.get('days') || '30');

  try {
    const [
      userGrowth,
      tokenUsage,
      jobStatus,
      jobsOverTime,
      subscriptionDistribution,
      recentActivity,
    ] = await Promise.all([
      getUserGrowthData(days),
      getTokenUsageData(days),
      getJobStatusDistribution(),
      getJobsOverTime(days),
      getSubscriptionDistribution(),
      getRecentActivity(15),
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

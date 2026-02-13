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

export async function GET(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
    getArchetypeJobCounts(),
    getArchetypeImageCounts(),
    getWorkflowImageCounts(),
    getArchetypeActionCounts(),
    getWorkflowActionCounts(),
    getTopUsersByActions(10),
    getActionConversionRates(),
    getRecentAdActivity(50),
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

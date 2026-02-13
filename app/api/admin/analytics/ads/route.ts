import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/auth/admin';
import {
  getArchetypeJobCounts,
  getArchetypeImageCounts,
  getWorkflowImageCounts,
  getArchetypeActionCounts,
  getWorkflowActionCounts,
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
  ] = await Promise.all([
    getArchetypeJobCounts(),
    getArchetypeImageCounts(),
    getWorkflowImageCounts(),
    getArchetypeActionCounts(),
    getWorkflowActionCounts(),
  ]);

  return NextResponse.json({
    archetypeJobs,
    archetypeImages,
    workflowImages,
    archetypeActions,
    workflowActions,
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/auth/admin';
import { getWorkflowErrors, markErrorResolved } from '@/lib/db/queries/admin';

export async function GET(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const workflowId = searchParams.get('workflowId') || undefined;
  const nodeId = searchParams.get('nodeId') || undefined;
  const errorLevel = searchParams.get('errorLevel') || undefined;
  const isResolved = searchParams.get('isResolved') === 'true' ? true : searchParams.get('isResolved') === 'false' ? false : undefined;

  const result = await getWorkflowErrors({
    page,
    limit,
    filters: {
      workflowId,
      nodeId,
      errorLevel,
      isResolved,
    },
  });

  return NextResponse.json(result);
}

export async function PATCH(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { errorId, resolvedBy, resolutionNote } = body;

  if (!errorId || !resolvedBy) {
    return NextResponse.json({ error: 'errorId and resolvedBy are required' }, { status: 400 });
  }

  try {
    const updated = await markErrorResolved(errorId, resolvedBy, resolutionNote);
    if (!updated) {
      return NextResponse.json({ error: 'Error not found' }, { status: 404 });
    }
    return NextResponse.json({ error: updated });
  } catch (error) {
    console.error('Error marking error as resolved:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

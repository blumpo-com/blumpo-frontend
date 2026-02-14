import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/auth/admin';
import { getAllUsers, updateUserRole, updateUserBanStatus } from '@/lib/db/queries/admin';
import { UserRole } from '@/lib/db/schema/enums';

export async function GET(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const search = searchParams.get('search') || undefined;
  const role = searchParams.get('role') as UserRole | null;
  const banned = searchParams.get('banned');

  const result = await getAllUsers({
    page,
    limit,
    filters: {
      search,
      role: role || undefined,
      banned: banned === 'true' ? true : banned === 'false' ? false : undefined,
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
  const { userId, role, banned } = body;

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  try {
    if (role !== undefined) {
      if (!Object.values(UserRole).includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }
      const updated = await updateUserRole(userId, role);
      if (!updated) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      return NextResponse.json({ user: updated });
    }

    if (banned !== undefined) {
      const updated = await updateUserBanStatus(userId, banned);
      if (!updated) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      return NextResponse.json({ user: updated });
    }

    return NextResponse.json({ error: 'No valid update provided' }, { status: 400 });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

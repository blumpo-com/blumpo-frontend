import { and, eq } from 'drizzle-orm';
import { db } from '../drizzle';
import { user } from '../schema/index';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/session';

// Authentication and user management
export async function getUser() {
  const sessionCookie = (await cookies()).get('session');
  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  const sessionData = await verifyToken(sessionCookie.value);
  if (
    !sessionData ||
    !sessionData.user ||
    typeof sessionData.user.id !== 'string'
  ) {
    return null;
  }

  if (new Date(sessionData.expires) < new Date()) {
    return null;
  }

  const result = await db
    .select()
    .from(user)
    .where(and(eq(user.id, sessionData.user.id), eq(user.banFlag, false)))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  return result[0];
}

export async function getUserByEmail(email: string) {
  const result = await db
    .select()
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}
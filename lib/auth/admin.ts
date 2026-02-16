import { User } from '@/lib/db/schema';
import { UserRole } from '@/lib/db/schema/enums';
import { getUser } from '@/lib/db/queries/user';
import { redirect } from 'next/navigation';

/**
 * Type guard to check if a user is an admin
 */
export function isAdmin(user: User | null): user is User & { role: UserRole.ADMIN } {
  return user !== null && user.role === UserRole.ADMIN;
}

/**
 * Get the current user if they are an admin, otherwise return null
 * This function validates the role from the database, not just the session
 */
export async function getAdminUser(): Promise<(User & { role: UserRole.ADMIN }) | null> {
  const user = await getUser();
  if (!user || user.role !== UserRole.ADMIN) {
    return null;
  }
  return user as User & { role: UserRole.ADMIN };
}

/**
 * Require admin access - throws error or redirects if user is not admin
 * Use this in server components or API routes
 */
export async function requireAdmin(): Promise<User & { role: UserRole.ADMIN }> {
  const admin = await getAdminUser();
  if (!admin) {
    redirect('/dashboard?error=unauthorized');
  }
  return admin;
}

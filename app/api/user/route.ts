import { getUser, getUserWithTokenAccount } from '@/lib/db/queries';

export async function GET() {
  const user = await getUser();
  
  if (!user) {
    return Response.json(null);
  }

  // Get user with token account information
  const userWithAccount = await getUserWithTokenAccount(user.id);
  
  return Response.json({
    ...user,
    tokenAccount: userWithAccount?.tokenAccount || null
  });
}

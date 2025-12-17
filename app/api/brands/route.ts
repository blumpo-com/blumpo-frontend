import { getUser } from '@/lib/db/queries';
import { getBrandsByUserId } from '@/lib/db/queries/brand';

export async function GET() {
  const user = await getUser();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const brands = await getBrandsByUserId(user.id);
  
  return Response.json(brands);
}


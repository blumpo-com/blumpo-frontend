import { NextRequest } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { getBrandsByUserId } from '@/lib/db/queries/brand';
import { normalizeWebsiteUrl } from '@/lib/utils';

export async function GET(req: NextRequest) {
  const user = await getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = req.nextUrl.searchParams.get('url');
  if (!url || typeof url !== 'string') {
    return Response.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  const normalizedUrl = normalizeWebsiteUrl(url);
  const brands = await getBrandsByUserId(user.id);
  const matchingBrand = brands.find(
    (b) => normalizeWebsiteUrl(b.websiteUrl) === normalizedUrl
  );

  if (matchingBrand) {
    return Response.json({
      exists: true,
      brand: { id: matchingBrand.id, name: matchingBrand.name },
    });
  }

  return Response.json({ exists: false });
}

import { getUser } from '@/lib/db/queries';
import { getBrandWithInsights, updateBrand, updateBrandInsights } from '@/lib/db/queries/brand';
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ brandId: string }> }
) {
  const user = await getUser();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { brandId } = await params;
  const brandData = await getBrandWithInsights(brandId);
  
  if (!brandData) {
    return Response.json({ error: 'Brand not found' }, { status: 404 });
  }

  // Verify brand belongs to user
  if (brandData.userId !== user.id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  return Response.json(brandData);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ brandId: string }> }
) {
  const user = await getUser();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { brandId } = await params;
  const body = await request.json();

  // Verify brand exists and belongs to user
  const brandData = await getBrandWithInsights(brandId);
  if (!brandData) {
    return Response.json({ error: 'Brand not found' }, { status: 404 });
  }

  if (brandData.userId !== user.id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Separate brand and insights updates
  const brandUpdates: any = {};
  const insightsUpdates: any = {};

  if (body.name !== undefined) brandUpdates.name = body.name;
  if (body.websiteUrl !== undefined) brandUpdates.websiteUrl = body.websiteUrl;
  if (body.language !== undefined) brandUpdates.language = body.language;
  if (body.fonts !== undefined) brandUpdates.fonts = body.fonts;
  if (body.colors !== undefined) brandUpdates.colors = body.colors;
  if (body.photos !== undefined) brandUpdates.photos = body.photos;
  if (body.heroPhotos !== undefined) brandUpdates.heroPhotos = body.heroPhotos;
  if (body.logoUrl !== undefined) brandUpdates.logoUrl = body.logoUrl;
  if (body.websiteDataUrl !== undefined) brandUpdates.websiteDataUrl = body.websiteDataUrl;

  if (body.brandVoice !== undefined) insightsUpdates.brandVoice = body.brandVoice;
  if (body.industry !== undefined) insightsUpdates.industry = body.industry;
  if (body.customerPainPoints !== undefined) insightsUpdates.customerPainPoints = body.customerPainPoints;
  if (body.productDescription !== undefined) insightsUpdates.productDescription = body.productDescription;
  if (body.keyFeatures !== undefined) insightsUpdates.keyFeatures = body.keyFeatures;
  if (body.uniqueValueProp !== undefined) insightsUpdates.uniqueValueProp = body.uniqueValueProp;
  if (body.keyBenefits !== undefined) insightsUpdates.keyBenefits = body.keyBenefits;
  if (body.competitors !== undefined) insightsUpdates.competitors = body.competitors;
  if (body.targetCustomers !== undefined) insightsUpdates.targetCustomers = body.targetCustomers;
  if (body.solution !== undefined) insightsUpdates.solution = body.solution;

  // Update brand if there are updates
  let updatedBrand = brandData;
  if (Object.keys(brandUpdates).length > 0) {
    updatedBrand = {
      ...(await updateBrand(brandId, brandUpdates)),
      insights: brandData.insights, // preserve "insights" property structure
    };
  }

  // Update or create insights if there are updates
  let updatedInsights = brandData.insights;
  if (Object.keys(insightsUpdates).length > 0) {
    if (brandData.insights) {
      updatedInsights = await updateBrandInsights(brandId, insightsUpdates);
    } else {
      // Create insights if they don't exist
      const { createBrandInsights } = await import('@/lib/db/queries/brand');
      updatedInsights = await createBrandInsights({
        brandId,
        ...insightsUpdates,
      });
    }
  }

  return Response.json({
    ...updatedBrand,
    insights: updatedInsights,
  });
}

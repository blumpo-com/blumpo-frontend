import { eq, and } from 'drizzle-orm';
import { db } from '../drizzle';
import { brand, brandInsights } from '../schema/index';

// Get brand by ID (core data only)
export async function getBrandById(brandId: string) {
  const result = await db
    .select()
    .from(brand)
    .where(and(eq(brand.id, brandId), eq(brand.isDeleted, false)))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

// Get brand insights by brand ID
export async function getBrandInsightsByBrandId(brandId: string) {
  const result = await db
    .select()
    .from(brandInsights)
    .where(eq(brandInsights.brandId, brandId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

// Get brand with insights (combined)
export async function getBrandWithInsights(brandId: string) {
  const brandData = await getBrandById(brandId);
  if (!brandData) {
    return null;
  }

  const insights = await getBrandInsightsByBrandId(brandId);

  return {
    ...brandData,
    insights: insights || null,
  };
}

// Get all brands for a user (core data only)
export async function getBrandsByUserId(userId: string) {
  return await db
    .select()
    .from(brand)
    .where(and(eq(brand.userId, userId), eq(brand.isDeleted, false)))
    .orderBy(brand.createdAt);
}

// Get all brands with insights for a user
export async function getBrandsWithInsightsByUserId(userId: string) {
  const brands = await getBrandsByUserId(userId);

  // Fetch insights for all brands
  const brandsWithInsights = await Promise.all(
    brands.map(async (b) => {
      const insights = await getBrandInsightsByBrandId(b.id);
      return {
        ...b,
        insights: insights || null,
      };
    })
  );

  return brandsWithInsights;
}

// Get brand by user ID and website URL
export async function getBrandByWebsiteUrl(userId: string, websiteUrl: string) {
  const result = await db
    .select()
    .from(brand)
    .where(
      and(
        eq(brand.userId, userId),
        eq(brand.websiteUrl, websiteUrl),
        eq(brand.isDeleted, false)
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

// Create brand (core data only)
export async function createBrand(data: {
  id?: string;
  userId: string;
  name: string;
  websiteUrl: string;
  language?: string;
  fonts?: any;
  colors?: string[];
  photos?: string[];
  heroPhotos?: string[];
  logoUrl?: string;
  websiteDataUrl?: string;
}) {
  const [newBrand] = await db
    .insert(brand)
    .values({
      id: data.id,
      userId: data.userId,
      name: data.name,
      websiteUrl: data.websiteUrl,
      language: data.language || 'en',
      fonts: data.fonts || [],
      colors: data.colors || [],
      photos: data.photos || [],
      heroPhotos: data.heroPhotos || [],
      logoUrl: data.logoUrl,
      websiteDataUrl: data.websiteDataUrl,
    })
    .returning();

  return newBrand;
}

// Create brand insights
export async function createBrandInsights(data: {
  brandId: string;
  clientAdPreferences?: any;
  industry?: string;
  customerPainPoints?: string[];
  productDescription?: string;
  keyFeatures?: string[];
  brandVoice?: string;
  uniqueValueProp?: string;
  keyBenefits?: string[];
  competitors?: string[];
  insTriggerEvents?: string[];
  insAspirations?: string[];
  insMarketingInsight?: string;
  insTrendOpportunity?: string;
  insRaw?: any;
  marketingBrief?: string;
  redditCustomerDesires?: any;
  redditCustomerPainPoints?: any;
  redditInterestingQuotes?: any;
  redditPurchaseTriggers?: any;
  redditMarketingBrief?: string;
  targetCustomers?: string[];
  solution?: string;
}) {
  const [newInsights] = await db
    .insert(brandInsights)
    .values({
      brandId: data.brandId,
      clientAdPreferences: data.clientAdPreferences || {},
      industry: data.industry,
      customerPainPoints: data.customerPainPoints || [],
      productDescription: data.productDescription,
      keyFeatures: data.keyFeatures || [],
      brandVoice: data.brandVoice,
      uniqueValueProp: data.uniqueValueProp,
      keyBenefits: data.keyBenefits || [],
      competitors: data.competitors || [],
      insTriggerEvents: data.insTriggerEvents || [],
      insAspirations: data.insAspirations || [],
      insMarketingInsight: data.insMarketingInsight,
      insTrendOpportunity: data.insTrendOpportunity,
      insRaw: data.insRaw || [],
      marketingBrief: data.marketingBrief,
      redditCustomerDesires: data.redditCustomerDesires,
      redditCustomerPainPoints: data.redditCustomerPainPoints,
      redditInterestingQuotes: data.redditInterestingQuotes,
      redditPurchaseTriggers: data.redditPurchaseTriggers,
      redditMarketingBrief: data.redditMarketingBrief,
      targetCustomers: data.targetCustomers || [],
      solution: data.solution,
    })
    .returning();

  return newInsights;
}

// Update brand (core data only)
export async function updateBrand(
  brandId: string,
  data: {
    name?: string;
    websiteUrl?: string;
    language?: string;
    fonts?: any;
    colors?: string[];
    photos?: string[];
    heroPhotos?: string[];
    logoUrl?: string;
    websiteDataUrl?: string;
  }
) {
  const [updated] = await db
    .update(brand)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(brand.id, brandId))
    .returning();

  return updated;
}

// Update brand insights
export async function updateBrandInsights(
  brandId: string,
  data: Partial<Omit<typeof brandInsights.$inferInsert, 'brandId' | 'createdAt'>>
) {
  const [updated] = await db
    .update(brandInsights)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(brandInsights.brandId, brandId))
    .returning();

  return updated;
}

// Soft delete brand
export async function deleteBrand(brandId: string) {
  const [deleted] = await db
    .update(brand)
    .set({
      isDeleted: true,
      updatedAt: new Date(),
    })
    .where(eq(brand.id, brandId))
    .returning();

  return deleted;
}


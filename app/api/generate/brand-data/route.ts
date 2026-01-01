import { NextResponse } from "next/server";
import { getUser } from "@/lib/db/queries";
import { getGenerationJobById } from "@/lib/db/queries/generation";
import { getBrandWithInsights } from "@/lib/db/queries/brand";

export async function GET(req: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('job_id');

    if (!jobId) {
      return NextResponse.json({ error: "job_id required" }, { status: 400 });
    }

    // Get the generation job
    const job = await getGenerationJobById(jobId);
    if (!job || job.userId !== user.id) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // If no brandId, return null
    if (!job.brandId) {
      return NextResponse.json({
        brand: null,
        insights: null,
      });
    }

    // Get brand with insights
    const brandWithInsights = await getBrandWithInsights(job.brandId);

    if (!brandWithInsights) {
      return NextResponse.json({
        brand: null,
        insights: null,
      });
    }

    return NextResponse.json({
      brand: {
        id: brandWithInsights.id,
        name: brandWithInsights.name,
        websiteUrl: brandWithInsights.websiteUrl,
        language: brandWithInsights.language,
        fonts: brandWithInsights.fonts,
        colors: brandWithInsights.colors,
        logoUrl: brandWithInsights.logoUrl,
      },
      insights: brandWithInsights.insights ? {
        customerPainPoints: brandWithInsights.insights.customerPainPoints || [],
        targetCustomers: brandWithInsights.insights.targetCustomers || [],
        customerGroups: brandWithInsights.insights.targetCustomers || [], // Using targetCustomers as customer groups
        redditCustomerPainPoints: brandWithInsights.insights.redditCustomerPainPoints || [],
        redditCustomerDesires: brandWithInsights.insights.redditCustomerDesires || [],
      } : null,
    });
  } catch (error) {
    console.error('[GENERATE-BRAND-DATA] Error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


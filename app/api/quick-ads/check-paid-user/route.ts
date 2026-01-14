import { NextResponse } from "next/server";
import { getUser } from "@/lib/db/queries";
import { getQuickAdsCountByFormat } from "@/lib/db/queries/ads";
import { getBrandById } from "@/lib/db/queries/brand";
import { getUserWithTokenBalance } from "@/lib/db/queries/tokens";

const REQUIRED_ADS_PER_FORMAT = 10; // Paid users need 10 ads per format (20 total)

// Check if paid user has enough quick ads (20 total: 10 1:1 + 10 16:9)
export async function GET(req: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is paid
    const userWithToken = await getUserWithTokenBalance(user.id);
    const tokenAccount = userWithToken?.tokenAccount;
    if (!tokenAccount || tokenAccount.planCode === 'FREE') {
      return NextResponse.json({
        isPaid: false,
        needsGeneration: false,
      });
    }

    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get('brandId');

    // Verify brand belongs to user if provided
    let verifiedBrandId = null;
    if (brandId) {
      const brand = await getBrandById(brandId);
      if (!brand || brand.userId !== user.id) {
        return NextResponse.json({ error: "Brand not found" }, { status: 404 });
      }
      verifiedBrandId = brandId;
    }

    // Check counts for both formats
    const format1x1Count = await getQuickAdsCountByFormat(user.id, verifiedBrandId, '1:1');
    const format16x9Count = await getQuickAdsCountByFormat(user.id, verifiedBrandId, '16:9');

    const needs1x1 = format1x1Count < REQUIRED_ADS_PER_FORMAT;
    const needs16x9 = format16x9Count < REQUIRED_ADS_PER_FORMAT;

    return NextResponse.json({
      isPaid: true,
      needsGeneration: needs1x1 || needs16x9,
      format1x1Count,
      format16x9Count,
      needs1x1,
      needs16x9,
    });
  } catch (error) {
    console.error('[QUICK-ADS] Error checking paid user:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


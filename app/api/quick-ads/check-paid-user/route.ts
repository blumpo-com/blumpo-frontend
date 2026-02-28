import { NextResponse } from "next/server";
import { getUser } from "@/lib/db/queries";
import { getQuickAdsCountByFormat } from "@/lib/db/queries/ads";
import { getBrandById } from "@/lib/db/queries/brand";
import { getUserWithTokenBalance } from "@/lib/db/queries/tokens";

const REQUIRED_ADS_PER_FORMAT = 10; // Paid users need 10 ads per format (20 total)

/** Set to true to allow triggering quick ads generation from dashboard when NEXT_PUBLIC_IS_TEST_MODE is true. */
const ALLOW_QUICK_ADS_IN_TEST_MODE = false;

// Check if paid user has enough quick ads (20 total: 10 1:1 + 10 9:16)
export async function GET(req: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // In test mode, return needsGeneration: false so dashboard does not trigger auto-generation (unless ALLOW_QUICK_ADS_IN_TEST_MODE is true for manual testing)
    if (process.env.NEXT_PUBLIC_IS_TEST_MODE === "true" && !ALLOW_QUICK_ADS_IN_TEST_MODE) {
      return NextResponse.json({
        isPaid: true,
        needsGeneration: false,
        format1x1Count: REQUIRED_ADS_PER_FORMAT,
        format9x16Count: REQUIRED_ADS_PER_FORMAT,
        needs1x1: false,
        needs9x16: false,
      });
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
    const format9x16Count = await getQuickAdsCountByFormat(user.id, verifiedBrandId, '9:16');
    console.log('format1x1Count', format1x1Count);
    console.log('format9x16Count', format9x16Count);

    const needs1x1 = format1x1Count < REQUIRED_ADS_PER_FORMAT;
    const needs9x16 = format9x16Count < REQUIRED_ADS_PER_FORMAT;

    return NextResponse.json({
      isPaid: true,
      needsGeneration: needs1x1 || needs9x16,
      format1x1Count,
      format9x16Count,
      needs1x1,
      needs9x16,
    });
  } catch (error) {
    console.error('[QUICK-ADS] Error checking paid user:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


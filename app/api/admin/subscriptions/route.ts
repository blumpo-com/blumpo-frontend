import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/auth/admin';
import { getAllSubscriptionPlans, getAllTopupPlans, getAllGenerationPricing } from '@/lib/db/queries/admin';

export async function GET(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [plans, topups, pricing] = await Promise.all([
    getAllSubscriptionPlans(),
    getAllTopupPlans(),
    getAllGenerationPricing(),
  ]);

  return NextResponse.json({
    subscriptionPlans: plans,
    topupPlans: topups,
    generationPricing: pricing,
  });
}

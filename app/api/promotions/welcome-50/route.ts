import { NextResponse } from 'next/server';
import { getUser, getUserWithTokenAccount, getOrCreateWelcomePromotion } from '@/lib/db/queries';

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userWithAccount = await getUserWithTokenAccount(user.id);
    const tokenAccount = userWithAccount?.tokenAccount;

    if (!tokenAccount) {
      return NextResponse.json({ eligible: false });
    }

    const stripePromotionCodeId = process.env.STRIPE_WELCOME_PROMOTION_CODE_ID ?? null;
    const result = await getOrCreateWelcomePromotion(
      tokenAccount.userId,
      tokenAccount.planCode,
      stripePromotionCodeId
    );

    return NextResponse.json(result);
  } catch (err) {
    console.error('Welcome promotion error:', err);
    return NextResponse.json(
      { error: 'Failed to get welcome promotion' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { getUser, getUserWithTokenAccount } from '@/lib/db/queries';
import { updateUserSubscription } from '@/lib/db/queries/subscription';
import { stripe } from '@/lib/payments/stripe';

/** Reactivate a subscription scheduled for cancellation (cancel_at_period_end → false). */
export async function POST() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userWithAccount = await getUserWithTokenAccount(user.id);
    const tokenAccount = userWithAccount?.tokenAccount;
    const subId = tokenAccount?.stripeSubscriptionId;

    if (!subId) {
      return NextResponse.json(
        { error: 'No active subscription found', ok: false },
        { status: 400 }
      );
    }

    const sub = await stripe.subscriptions.retrieve(subId);
    if (!sub.cancel_at_period_end) {
      return NextResponse.json({
        ok: true,
        message: 'Subscription is already active',
        already_active: true,
      });
    }

    await stripe.subscriptions.update(subId, {
      cancel_at_period_end: false,
    });

    await updateUserSubscription(user.id, {
      subscriptionStatus: 'active',
      cancellationTime: null,
    });

    return NextResponse.json({ ok: true, reactivated: true });
  } catch (err) {
    console.error('[reactivate-subscription]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Reactivate failed', ok: false },
      { status: 500 }
    );
  }
}

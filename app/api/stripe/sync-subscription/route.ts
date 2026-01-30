import { NextResponse } from 'next/server';
import { getUser, getUserWithTokenAccount } from '@/lib/db/queries';
import { updateUserSubscription } from '@/lib/db/queries/subscription';
import { stripe } from '@/lib/payments/stripe';

/** Sync subscription_status and cancellation_time from Stripe. Call after return from Customer Portal cancel flow when webhook may not have fired. */
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
        { error: 'No active subscription to sync', synced: false },
        { status: 400 }
      );
    }

    const sub = await stripe.subscriptions.retrieve(subId);
    const cancelAtPeriodEnd = !!sub.cancel_at_period_end;
    const cancellationTime =
      cancelAtPeriodEnd && sub.cancel_at ? new Date(sub.cancel_at * 1000) : null;

    await updateUserSubscription(user.id, {
      subscriptionStatus: cancelAtPeriodEnd ? 'cancel_at_period_end' : sub.status,
      cancellationTime,
    });

    return NextResponse.json({
      ok: true,
      synced: true,
      subscription_status: cancelAtPeriodEnd ? 'cancel_at_period_end' : sub.status,
      cancellation_time: cancellationTime?.toISOString() ?? null,
    });
  } catch (err) {
    console.error('[sync-subscription]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Sync failed' },
      { status: 500 }
    );
  }
}

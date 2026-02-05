import { NextResponse } from 'next/server';
import { getUser, getUserWithTokenAccount } from '@/lib/db/queries';
import {
  updateUserSubscription,
  getSubscriptionPlanByStripeProductId,
} from '@/lib/db/queries/subscription';
import { stripe } from '@/lib/payments/stripe';
import { SubscriptionPeriod } from '@/lib/db/schema/enums';

/** Full sync from Stripe: status, cancellation, period, planCode, stripePriceId. Call after return from Customer Portal when webhook may not have fired. */
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
    const subscriptionStatus = cancelAtPeriodEnd ? 'cancel_at_period_end' : sub.status;

    const subscriptionData: Parameters<typeof updateUserSubscription>[1] = {
      subscriptionStatus,
      cancellationTime,
    };

    if (sub.status === 'active' || sub.status === 'trialing') {
      const plan = sub.items.data[0]?.price;
      const stripePriceId = plan?.id;
      const stripeProductId =
        typeof plan?.product === 'string' ? plan.product : plan?.product?.id;
      const interval = plan?.recurring?.interval;
      if (stripePriceId && stripeProductId && interval) {
        const period =
          interval === 'year' ? SubscriptionPeriod.YEARLY : SubscriptionPeriod.MONTHLY;
        const matchingPlan = await getSubscriptionPlanByStripeProductId(stripeProductId);
        const planCode = matchingPlan?.planCode ?? tokenAccount?.planCode ?? 'FREE';
        Object.assign(subscriptionData, {
          stripePriceId,
          stripeProductId,
          period,
          planCode,
        });
      }
    }

    await updateUserSubscription(user.id, subscriptionData);

    return NextResponse.json({
      ok: true,
      synced: true,
      subscription_status: subscriptionStatus,
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

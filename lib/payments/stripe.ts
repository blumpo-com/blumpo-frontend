import Stripe from 'stripe';
import { redirect } from 'next/navigation';
import { SubscriptionPeriod, TokenAccount } from '@/lib/db/schema';
import {
  getTokenAccountByStripeCustomerId,
  getUser,
  getUserWithTokenAccount,
  updateUserSubscription,
  getSubscriptionPlans,
  getTopupPlans,
  getSubscriptionPlan,
  getSubscriptionPlanByStripeProductId,
  getTopupPlan,
  addTopupTokens,
  refillSubscriptionTokens,
  activateSubscription,
  setRetentionOfferApplied,
} from '@/lib/db/queries';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil'
});

export async function createCheckoutSession({
  priceId,
  isTopup = false
}: {
  priceId: string;
  isTopup?: boolean;
}) {
  const user = await getUser();

  if (!user) {
    redirect(`/sign-up?redirect=checkout&priceId=${priceId}`);
  }

  // Get user's token account to check for existing Stripe customer
  const userWithAccount = await getUserWithTokenAccount(user.id);
  const tokenAccount = userWithAccount?.tokenAccount;

  const sessionData: Stripe.Checkout.SessionCreateParams = {
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1
      }
    ],
    mode: isTopup ? 'payment' : 'subscription',
    success_url: `${process.env.BASE_URL}/api/stripe/checkout?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.BASE_URL}/dashboard/your-credits`,
    customer: tokenAccount?.stripeCustomerId || undefined,
    client_reference_id: user.id,
    allow_promotion_codes: true,
    customer_update: {
      name: 'auto',
      address: 'auto',
      shipping: 'auto',
    },
    billing_address_collection: 'auto',
    tax_id_collection: {
      enabled: true,
      // required: 'never'
    },
    automatic_tax: {
      enabled: true,
    },
  };

  // Don't add trial for subscription

  const session = await stripe.checkout.sessions.create(sessionData);
  redirect(session.url!);
}

export async function createCustomerPortalSession(userId: string) {
  const userWithAccount = await getUserWithTokenAccount(userId);
  const tokenAccount = userWithAccount?.tokenAccount;

  if (!tokenAccount?.stripeCustomerId || !tokenAccount?.stripeProductId) {
    redirect('/dashboard/your-credits');
  }

  let configuration: Stripe.BillingPortal.Configuration;
  const configurations = await stripe.billingPortal.configurations.list();

  if (configurations.data.length > 0) {
    configuration = configurations.data[0];
  } else {
    const product = await stripe.products.retrieve(tokenAccount.stripeProductId);
    if (!product.active) {
      throw new Error("User's product is not active in Stripe");
    }

    const prices = await stripe.prices.list({
      product: product.id,
      active: true
    });
    if (prices.data.length === 0) {
      throw new Error("No active prices found for the user's product");
    }

    configuration = await stripe.billingPortal.configurations.create({
      business_profile: {
        headline: 'Manage your subscription'
      },
      features: {
        subscription_update: {
          enabled: true,
          default_allowed_updates: ['price', 'quantity', 'promotion_code'],
          proration_behavior: 'create_prorations',
          products: [
            {
              product: product.id,
              prices: prices.data.map((price) => price.id)
            }
          ]
        },
        subscription_cancel: {
          enabled: true,
          mode: 'at_period_end',
          cancellation_reason: {
            enabled: true,
            options: [
              'too_expensive',
              'missing_features',
              'switched_service',
              'unused',
              'other'
            ]
          }
        },
        payment_method_update: {
          enabled: true
        }
      }
    });
  }

  return stripe.billingPortal.sessions.create({
    customer: tokenAccount.stripeCustomerId,
    return_url: `${process.env.BASE_URL}/dashboard`,
    configuration: configuration.id
  });
}

export async function handleSubscriptionChange(
  subscription: Stripe.Subscription
) {
  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : (subscription.customer as Stripe.Customer)?.id;
  if (!customerId) {
    console.error('[handleSubscriptionChange] Missing subscription.customer');
    return;
  }

  const subscriptionId = subscription.id;
  const status = subscription.status;
  const cancelAtPeriodEnd = !!subscription.cancel_at_period_end;
  const cancelAt = subscription.cancel_at
    ? new Date(subscription.cancel_at * 1000)
    : null;

  // eslint-disable-next-line no-console
  console.log('[handleSubscriptionChange]', {
    subscriptionId,
    customerId,
    status,
    cancel_at_period_end: cancelAtPeriodEnd,
    cancel_at: cancelAt?.toISOString() ?? null,
  });

  const userWithAccount = await getTokenAccountByStripeCustomerId(customerId);

  if (!userWithAccount) {
    console.error('[handleSubscriptionChange] User not found for Stripe customer:', customerId);
    return;
  }

  const userId = userWithAccount.user.id;
  const currentTokenAccount = userWithAccount.tokenAccount;

  if (status === 'active' || status === 'trialing') {
    const plan = subscription.items.data[0]?.price;
    const stripePriceId = plan?.id!;
    const stripeProductId = plan?.product as string;
    const interval = plan?.recurring?.interval;
    if (!interval) {
      throw new Error('No interval found for this subscription.');
    }
    const period = interval === 'year' ? SubscriptionPeriod.YEARLY : SubscriptionPeriod.MONTHLY;

    // Find matching subscription plan by Stripe product ID
    const matchingPlan = await getSubscriptionPlanByStripeProductId(stripeProductId);
    const planCode = matchingPlan?.planCode || 'FREE';

    // Cancel old subscription if user is changing plans 
    if (currentTokenAccount?.stripeSubscriptionId &&
      currentTokenAccount.stripeSubscriptionId !== subscriptionId) {
      try {
        await stripe.subscriptions.cancel(currentTokenAccount.stripeSubscriptionId);
        console.log(`Cancelled old subscription: ${currentTokenAccount.stripeSubscriptionId}`);
      } catch (error) {
        console.error('Error cancelling old subscription:', error);
        // Continue with new subscription even if old one couldn't be cancelled
      }
    }

    const cancellationTime = cancelAtPeriodEnd && cancelAt ? cancelAt : null;

    // eslint-disable-next-line no-console
    console.log('[handleSubscriptionChange] active branch', {
      cancelAtPeriodEnd,
      cancellationTime: cancellationTime?.toISOString() ?? null,
      subscriptionStatus: cancelAtPeriodEnd ? 'cancel_at_period_end' : status,
    });

    const subscriptionData = {
      stripeSubscriptionId: subscriptionId,
      stripeProductId: stripeProductId,
      stripePriceId: stripePriceId,
      subscriptionStatus: cancelAtPeriodEnd ? 'cancel_at_period_end' : status,
      planCode: planCode,
      period: period,
      cancellationTime,
    };

    // Use activation function for active subscriptions to ensure proper token allocation
    if ((status === 'active' || status === 'trialing') && matchingPlan) {
      await activateSubscription(userId, subscriptionData, matchingPlan.monthlyTokens);
    } else {
      // Just update subscription data for trial status
      await updateUserSubscription(userId, subscriptionData);
    }
  } else if (status === 'canceled' || status === 'unpaid') {
    const cancellationTime = subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : 
    new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);
    await updateUserSubscription(userId, {
      cancellationTime,
      subscriptionStatus: 'cancel_at_period_end',
      stripeSubscriptionId: null,
      stripeProductId: null,
      stripePriceId: null,
    });
  }
}

export async function handlePaymentSuccess(
  session: Stripe.Checkout.Session
) {
  const customerId = session.customer as string;
  const sessionId = session.id;

  // Check if this is a one-time payment (topup)
  if (session.mode === 'payment') {
    const userWithAccount = await getTokenAccountByStripeCustomerId(customerId);

    if (!userWithAccount) {
      console.error('User not found for Stripe customer:', customerId);
      return;
    }

    const userId = userWithAccount.user.id;
    const priceId = session.line_items?.data[0]?.price?.id;

    if (priceId) {
      // Get the product ID from the price
      const price = await stripe.prices.retrieve(priceId);
      const productId = typeof price.product === 'string' ? price.product : price.product.id;

      // Find matching topup plan by product ID
      const topupPlans = await getTopupPlans();
      const matchingTopup = topupPlans.find(t => t.stripeProductId === productId);

      if (matchingTopup) {
        await addTopupTokens(userId, matchingTopup.tokensAmount, sessionId, matchingTopup.topupSku);
      }
    }
  }
}

export async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice
) {
  console.log('Handling invoice payment succeeded event');
  const customerId = invoice.customer as string;
  const subscriptionId = invoice.lines?.data?.[0]?.subscription as string;

  if (!subscriptionId) return; // Not a subscription invoice

  const userWithAccount = await getTokenAccountByStripeCustomerId(customerId);

  if (!userWithAccount) {
    console.error('User not found for Stripe customer:', customerId);
    return;
  }

  const userId = userWithAccount.user.id;
  const tokenAccount = userWithAccount.tokenAccount;

  // Get subscription plan
  const subscriptionPlan = await getSubscriptionPlan(tokenAccount.planCode);

  // Check if subscription is already refilled for this period
  const RefillDate = tokenAccount.nextRefillAt; // Date

  // If already refilled for this period, skip
  // Add 3 days buffer to avoid timezone issues
  const now = new Date();
  now.setDate(now.getDate() + 3);

  // Directly compare Date objects
  if (RefillDate && new Date(RefillDate) >= now) {
    console.log(`Subscription tokens already refilled for user ${userId} for period up to ${RefillDate}. Skipping refill.`);
    return;
  }


  if (subscriptionPlan) {
    // Refill tokens for monthly billing cycle
    // The refillSubscriptionTokens function now handles the logic of only adding
    // tokens if the user has fewer than the plan amount
    const refillDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    await refillSubscriptionTokens(userId, subscriptionPlan.monthlyTokens, refillDate);
  }
}

export async function getStripePrices() {
  const prices = await stripe.prices.list({
    expand: ['data.product'],
    active: true,
    type: 'recurring'
  });

  return prices.data.map((price) => ({
    id: price.id,
    productId:
      typeof price.product === 'string' ? price.product : price.product.id,
    unitAmount: price.unit_amount,
    currency: price.currency,
    interval: price.recurring?.interval,
    intervalCount: price.recurring?.interval_count,
    trialPeriodDays: price.recurring?.trial_period_days
  }));
}

export async function getStripeTopupPrices() {
  const prices = await stripe.prices.list({
    expand: ['data.product'],
    active: true,
    type: 'one_time'
  });

  return prices.data.map((price) => ({
    id: price.id,
    productId:
      typeof price.product === 'string' ? price.product : price.product.id,
    unitAmount: price.unit_amount,
    currency: price.currency,
  }));
}

export async function getStripeProducts() {
  const products = await stripe.products.list({
    active: true,
    expand: ['data.default_price']
  });

  return products.data.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    defaultPriceId:
      typeof product.default_price === 'string'
        ? product.default_price
        : product.default_price?.id
  }));
}

export async function cancelUserSubscription(userId: string) {
  const userWithAccount = await getUserWithTokenAccount(userId);

  if (!userWithAccount?.tokenAccount?.stripeSubscriptionId) {
    throw new Error('No active subscription found');
  }

  const { tokenAccount } = userWithAccount;

  // Schedule cancellation at period end (keep access until then)
  const sub = await stripe.subscriptions.update(tokenAccount.stripeSubscriptionId!, {
    cancel_at_period_end: true,
  });
  
  const cancellationTime = sub.cancel_at ? new Date(sub.cancel_at * 1000) : new Date();

  // Keep all Stripe data for potential reactivation, just set cancellation_time and status
  await updateUserSubscription(userId, {
    cancellationTime,
    subscriptionStatus: 'cancel_at_period_end'
  });

  console.log(`Scheduled cancellation at period end for subscription: ${tokenAccount.stripeSubscriptionId} for user: ${userId}. Access until ${cancellationTime.toISOString()}`);
}

export async function reactivateUserSubscription(userId: string) {
  const userWithAccount = await getUserWithTokenAccount(userId);

  if (!userWithAccount?.tokenAccount?.stripeSubscriptionId) {
    throw new Error('No subscription found to reactivate');
  }

  const { tokenAccount } = userWithAccount;

  // Check if subscription is scheduled for cancellation
  if (!tokenAccount.cancellationTime) {
    throw new Error('Subscription is not scheduled for cancellation');
  }

  // Check if cancellation time has already passed
  if (new Date(tokenAccount.cancellationTime) <= new Date()) {
    throw new Error('Cannot reactivate subscription - cancellation period has expired');
  }

  // Remove the scheduled cancellation in Stripe
  const sub = await stripe.subscriptions.update(tokenAccount.stripeSubscriptionId!, {
    cancel_at_period_end: false,
  });

  // Clear cancellation_time and restore active status
  await updateUserSubscription(userId, {
    cancellationTime: null,
    subscriptionStatus: sub.status
  });

  console.log(`Reactivated subscription: ${tokenAccount.stripeSubscriptionId} for user: ${userId}`);
}

/** Apply 70% off retention coupon to user's subscription (next invoice only). Call after adding 200 credits. */
export async function applyRetentionOffer(userId: string): Promise<{ ok: true } | { error: string }> {
  const couponId = process.env.STRIPE_RETENTION_COUPON_ID;
  if (!couponId) {
    console.error('STRIPE_RETENTION_COUPON_ID not set');
    return { error: 'Retention offer not configured' };
  }

  const userWithAccount = await getUserWithTokenAccount(userId);
  if (!userWithAccount?.tokenAccount) {
    return { error: 'Token account not found' };
  }

  const { tokenAccount } = userWithAccount;
  if (!tokenAccount.stripeSubscriptionId) {
    return { error: 'No active subscription' };
  }
  if (tokenAccount.retentionOfferAppliedAt) {
    return { error: 'Retention offer already applied' };
  }

  try {
    await stripe.subscriptions.update(tokenAccount.stripeSubscriptionId, {
      discounts: [{ coupon: couponId }],
    });
    await setRetentionOfferApplied(userId, tokenAccount.nextRefillAt ?? null);
    return { ok: true };
  } catch (err) {
    console.error('Failed to apply retention coupon:', err);
    return { error: err instanceof Error ? err.message : 'Failed to apply discount' };
  }
}

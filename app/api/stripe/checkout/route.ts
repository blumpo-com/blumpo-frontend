import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { user, tokenAccount } from '@/lib/db/schema';
import { setSession } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/payments/stripe';
import { updateUserSubscription, activateSubscription, addTopupTokens, getTopupPlans, getSubscriptionPlanByStripeProductId, getUserWithTokenAccount } from '@/lib/db/queries';
import Stripe from 'stripe';
import { SubscriptionPeriod } from '@/lib/db/schema/enums';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.redirect(new URL('/dashboard/your-credits', request.url));
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['customer', 'subscription', 'line_items'],
    });

    if (!session.customer || typeof session.customer === 'string') {
      throw new Error('Invalid customer data from Stripe.');
    }

    const customerId = session.customer.id;
    const userId = session.client_reference_id;
    
    if (!userId) {
      throw new Error("No user ID found in session's client_reference_id.");
    }

    const userRecord = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (userRecord.length === 0) {
      throw new Error('User not found in database.');
    }

    // Handle subscription checkout
    if (session.mode === 'subscription') {
      const subscriptionId =
        typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription?.id;

      if (!subscriptionId) {
        throw new Error('No subscription found for this session.');
      }

      const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['items.data.price.product'],
      });

      const plan = subscription.items.data[0]?.price;

      if (!plan) {
        throw new Error('No plan found for this subscription.');
      }

      const productId = (plan.product as Stripe.Product).id;
      const priceId = plan.id;

      if (!productId) {
        throw new Error('No product ID found for this subscription.');
      }

      // Get the interval from the price
      const interval = plan.recurring?.interval;
      if (!interval) {
        throw new Error('No interval found for this subscription.');
      }
      const period = interval === 'year' ? SubscriptionPeriod.YEARLY : SubscriptionPeriod.MONTHLY;

      // Find matching subscription plan by Stripe product ID
      const matchingPlan = await getSubscriptionPlanByStripeProductId(productId);
      const planCode = matchingPlan?.planCode || 'FREE';

      // Check if user has an existing subscription and cancel it
      const userWithAccount = await getUserWithTokenAccount(userId);
      const currentTokenAccount = userWithAccount?.tokenAccount;
      
      if (currentTokenAccount?.stripeSubscriptionId && 
          currentTokenAccount.stripeSubscriptionId !== subscriptionId) {
        try {
          // Cancel the old subscription to prevent double billing
          await stripe.subscriptions.cancel(currentTokenAccount.stripeSubscriptionId);
          console.log(`Cancelled old subscription during checkout: ${currentTokenAccount.stripeSubscriptionId}`);
        } catch (error) {
          console.error('Error cancelling old subscription during checkout:', error);
          // Continue with new subscription even if old one couldn't be cancelled
        }
      }

      // Create or update the user's token account with Stripe information
      await activateSubscription(userId, {
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        stripeProductId: productId,
        stripePriceId: priceId,
        subscriptionStatus: subscription.status,
        planCode: planCode,
        period: period,
      }, matchingPlan ? matchingPlan.monthlyTokens : 0);

    } 
    // Handle one-time payment (topup)
    else if (session.mode === 'payment') {
      const priceId = session.line_items?.data[0]?.price?.id;
      const priceName = session.line_items?.data[0]?.description;
      
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

      // Ensure user has Stripe customer ID
      await updateUserSubscription(userId, {
        stripeCustomerId: customerId,
      });
    }

    await setSession(userRecord[0]);
    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('Error handling successful checkout:', error);
    return NextResponse.redirect(new URL('/dashboard/your-credits?error=checkout_failed', request.url));
  }
}

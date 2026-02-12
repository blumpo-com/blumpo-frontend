import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/payments/stripe';
import { getSubscriptionPlanByStripeProductId, getTopupPlans } from '@/lib/db/queries';
import Stripe from 'stripe';

/**
 * API route to verify a Stripe checkout session and return purchase details
 * Used by client-side GTM purchase tracker
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'subscription'],
    });

    const mode = session.mode;
    const currency = session.currency || 'usd';
    const amountTotal = session.amount_total || 0;

    let plan: string | undefined;
    const items: Array<{
      item_id?: string;
      item_name?: string;
      price?: number;
      quantity?: number;
    }> = [];

    if (session.line_items?.data) {
      for (const lineItem of session.line_items.data) {
        const price = lineItem.price;
        const productId = typeof price?.product === 'string' ? price.product : price?.product?.id;

        if (mode === 'subscription' && productId) {
          // Find matching subscription plan
          const matchingPlan = await getSubscriptionPlanByStripeProductId(productId);
          plan = matchingPlan?.planCode;
        } else if (mode === 'payment' && productId) {
          // Find matching topup plan
          const topupPlans = await getTopupPlans();
          const matchingTopup = topupPlans.find(t => t.stripeProductId === productId);
          plan = matchingTopup?.displayName;
        }

        items.push({
          item_id: productId,
          item_name: lineItem.description || undefined,
          price: price?.unit_amount ? price.unit_amount / 100 : undefined,
          quantity: lineItem.quantity || 1,
        });
      }
    }

    return NextResponse.json({
      session_id: sessionId,
      mode,
      currency,
      amount_total: amountTotal,
      plan,
      items,
    });
  } catch (error) {
    console.error('Error verifying session:', error);
    return NextResponse.json(
      { error: 'Failed to verify session' },
      { status: 500 }
    );
  }
}

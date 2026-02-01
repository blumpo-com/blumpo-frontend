import { NextRequest, NextResponse } from 'next/server';
import { getUser, getUserWithTokenAccount } from '@/lib/db/queries';
import { stripe } from '@/lib/payments/stripe';
import Stripe from 'stripe';

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userWithAccount = await getUserWithTokenAccount(user.id);
    const tokenAccount = userWithAccount?.tokenAccount;

    if (!tokenAccount?.stripeCustomerId || !tokenAccount?.stripeProductId) {
      return NextResponse.json(
        { error: 'No Stripe account found' },
        { status: 400 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const flowType = searchParams.get('flow'); // 'subscription_update' or 'subscription_cancel'

    let configuration;
    const configurations = await stripe.billingPortal.configurations.list();

    if (configurations.data.length > 0) {
      configuration = configurations.data[0];
    } else {
      const product = await stripe.products.retrieve(tokenAccount.stripeProductId);
      if (!product.active) {
        return NextResponse.json(
          { error: "User's product is not active in Stripe" },
          { status: 400 }
        );
      }

      const prices = await stripe.prices.list({
        product: product.id,
        active: true
      });
      if (prices.data.length === 0) {
        return NextResponse.json(
          { error: "No active prices found for the user's product" },
          { status: 400 }
        );
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

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const returnToSettings = searchParams.get('returnTo') === 'settings';
    const returnPath =
      flowType === 'subscription_cancel'
        ? '/dashboard/settings?from=stripe_portal_cancel'
        : returnToSettings
          ? '/dashboard/settings?from=stripe_portal'
          : '/dashboard';
    const sessionParams: Stripe.BillingPortal.SessionCreateParams = {
      customer: tokenAccount.stripeCustomerId,
      return_url: `${baseUrl}${returnPath}`,
      configuration: configuration.id
    };

    // Add flow_data for direct navigation to subscription update or cancel
    if (flowType === 'subscription_update' && tokenAccount.stripeSubscriptionId) {
      sessionParams.flow_data = {
        type: 'subscription_update',
        subscription_update: {
          subscription: tokenAccount.stripeSubscriptionId
        }
      };
    } else if (flowType === 'subscription_cancel' && tokenAccount.stripeSubscriptionId) {
      sessionParams.flow_data = {
        type: 'subscription_cancel',
        subscription_cancel: {
          subscription: tokenAccount.stripeSubscriptionId
        }
      };
    }

    const portalSession = await stripe.billingPortal.sessions.create(sessionParams);
    
    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    return NextResponse.json(
      { error: 'Failed to create customer portal session' },
      { status: 500 }
    );
  }
}

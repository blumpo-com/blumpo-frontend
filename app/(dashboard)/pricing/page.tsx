import { checkoutAction, topupCheckoutAction } from '@/lib/payments/actions';
import { Check, Zap, AlertTriangle } from 'lucide-react';
import { getSubscriptionPlans, getTopupPlans, getUserWithTokenAccount } from '@/lib/db/queries';
import { getUser } from '@/lib/db/queries';
import { getStripePrices, getStripeTopupPrices } from '@/lib/payments/stripe';
import { SubmitButton } from './submit-button';

// Prices are fresh for one hour max
export const revalidate = 3600;

export default async function PricingPage() {
  const [subscriptionPlans, topupPlans, user, stripePrices, stripeTopupPrices] = await Promise.all([
    getSubscriptionPlans(),
    getTopupPlans(),
    getUser(),
    getStripePrices(),
    getStripeTopupPrices(),
  ]);

  // Get user's current token balance if logged in
  let userBalance = 0;
  let currentPlan = 'FREE';
  if (user) {
    const userWithAccount = await getUserWithTokenAccount(user.id);
    userBalance = userWithAccount?.tokenAccount?.balance || 0;
    currentPlan = userWithAccount?.tokenAccount?.planCode || 'FREE';
  }

  // Match subscription plans with their Stripe prices
  const validatedSubscriptionPlans = subscriptionPlans.map(plan => {
    let hasStripePrice = false;
    let stripePrice = null;
    
    // FREE plan doesn't need Stripe validation (it's free)
    if (plan.planCode === 'FREE') {
      hasStripePrice = true; // Mark as valid since it doesn't need a price
    } else if (plan.stripeProductId) {
      // Find the price for this product
      const matchingPrice = stripePrices.find(sp => sp.productId === plan.stripeProductId);
      if (matchingPrice) {
        stripePrice = matchingPrice;
        hasStripePrice = true;
      }
    }
    
    return {
      ...plan,
      hasStripePrice,
      stripePrice
    };
  });

  // Match topup plans with their Stripe prices
  const validatedTopupPlans = topupPlans.map(topup => {
    let hasStripePrice = false;
    let stripePrice = null;
    
    if (topup.stripeProductId) {
      // Find the price for this product
      const matchingPrice = stripeTopupPrices.find(sp => sp.productId === topup.stripeProductId);
      if (matchingPrice) {
        stripePrice = matchingPrice;
        hasStripePrice = true;
      }
    }
    
    return {
      ...topup,
      hasStripePrice,
      stripePrice
    };
  });

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {user && (
        <div className="mb-8 text-center">
          <p className="text-lg text-gray-600">
            Current Balance: <span className="font-semibold text-gray-900">{userBalance} tokens</span>
          </p>
          <p className="text-sm text-gray-500">
            Current Plan: <span className="font-medium text-blue-600">{currentPlan}</span>
          </p>
        </div>
      )}

      {/* Subscription Plans */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">Monthly Plans</h2>
        <p className="text-center text-gray-600 mb-8">Choose a plan that fits your needs</p>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {validatedSubscriptionPlans.map((plan) => (
            <SubscriptionCard
              key={plan.planCode}
              plan={plan}
              isCurrentPlan={currentPlan === plan.planCode}
            />
          ))}
        </div>
      </div>

      {/* Token Top-ups */}
      <div className="border-t pt-12">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">Token Top-ups</h2>
        <p className="text-center text-gray-600 mb-8">Need more tokens? Purchase them anytime</p>
        
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {validatedTopupPlans.map((topup) => (
            <TopupCard
              key={topup.topupSku}
              topup={topup}
            />
          ))}
        </div>
      </div>

      {/* Debug Information for Development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="border-t pt-12 mt-12">
          <details className="max-w-4xl mx-auto">
            <summary className="cursor-pointer text-lg font-medium text-gray-700 mb-4">
              Debug: Stripe Integration Status
            </summary>
            <div className="space-y-6">
              {/* Subscription Plans Status */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Subscription Plans</h4>
                <div className="space-y-2">
                  {validatedSubscriptionPlans.map(plan => (
                    <div key={plan.planCode} className="flex items-center justify-between text-sm">
                      <span>{plan.displayName} ({plan.planCode})</span>
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <div className="text-gray-600">
                            Product ID: {plan.stripeProductId || (plan.planCode === 'FREE' ? 'N/A (Free)' : 'Not set')}
                          </div>
                          <div className="text-gray-600">
                            Price ID: {plan.stripePrice?.id || (plan.planCode === 'FREE' ? 'N/A (Free)' : 'Not found')}
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          plan.hasStripePrice 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {plan.planCode === 'FREE' ? 'Free Plan' : (plan.hasStripePrice ? 'Valid' : 'Invalid')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Topup Plans Status */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Topup Plans</h4>
                <div className="space-y-2">
                  {validatedTopupPlans.map(topup => (
                    <div key={topup.topupSku} className="flex items-center justify-between text-sm">
                      <span>{topup.displayName} ({topup.topupSku})</span>
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <div className="text-gray-600">
                            Product ID: {topup.stripeProductId || 'Not set'}
                          </div>
                          <div className="text-gray-600">
                            Price ID: {topup.stripePrice?.id || 'Not found'}
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          topup.hasStripePrice 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {topup.hasStripePrice ? 'Valid' : 'Invalid'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Available Stripe Prices */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Available Stripe Subscription Prices</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  {stripePrices.map(price => (
                    <div key={price.id}>
                      {price.id} - ${price.unitAmount ? price.unitAmount / 100 : 0}/{price.interval}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Available Stripe One-time Prices</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  {stripeTopupPrices.map(price => (
                    <div key={price.id}>
                      {price.id} - ${price.unitAmount ? price.unitAmount / 100 : 0}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </details>
        </div>
      )}
    </main>
  );
}

function SubscriptionCard({
  plan,
  isCurrentPlan,
}: {
  plan: {
    planCode: string;
    displayName: string;
    monthlyTokens: number;
    stripeProductId: string | null;
    hasStripePrice: boolean;
    stripePrice: {
      id: string;
      productId: string;
      unitAmount: number | null;
      currency: string;
      interval: any;
      trialPeriodDays: number | null | undefined;
    } | null;
  };
  isCurrentPlan: boolean;
}) {
  const features = getFeaturesByPlan(plan.planCode);
  const stripePriceId = plan.stripePrice?.id || '';

  return (
    <div className={`pt-6 px-6 pb-8 border rounded-lg ${isCurrentPlan ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
      {isCurrentPlan && (
        <div className="mb-4">
          <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            Current Plan
          </span>
        </div>
      )}
      <h3 className="text-2xl font-medium text-gray-900 mb-2">{plan.displayName}</h3>
      <p className="text-sm text-gray-600 mb-2">
        {plan.monthlyTokens.toLocaleString()} tokens per month
      </p>
      <p className="text-sm text-gray-600 mb-4">
        with 14 day free trial
      </p>
      <p className="text-4xl font-medium text-gray-900 mb-6">
        {plan.planCode === 'FREE' ? (
          <>
            Free
          </>
        ) : plan.stripePrice?.unitAmount ? (
          <>
            ${(plan.stripePrice.unitAmount / 100).toFixed(2)}{' '}
            <span className="text-xl font-normal text-gray-600">
              / {plan.stripePrice.interval || 'month'}
            </span>
          </>
        ) : (
          <>
            <span className="text-lg text-gray-500">Price not available</span>
          </>
        )}
      </p>
      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700 text-sm">{feature}</span>
          </li>
        ))}
      </ul>
      {!isCurrentPlan && plan.planCode === 'FREE' && (
        <div className="text-center">
          <button 
            disabled 
            className="w-full bg-gray-100 text-gray-600 py-2 px-4 rounded cursor-not-allowed"
          >
            Current Free Plan
          </button>
        </div>
      )}
      {!isCurrentPlan && plan.planCode !== 'FREE' && stripePriceId && plan.hasStripePrice && (
        <form action={checkoutAction}>
          <input type="hidden" name="priceId" value={stripePriceId} />
          <SubmitButton />
        </form>
      )}
      {!isCurrentPlan && plan.planCode !== 'FREE' && (!stripePriceId || !plan.hasStripePrice) && (
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500 mr-1" />
            <p className="text-sm text-gray-500">
              {!stripePriceId ? 'Price not configured' : 'Stripe price not found'}
            </p>
          </div>
          <button 
            disabled 
            className="w-full bg-gray-300 text-gray-500 py-2 px-4 rounded cursor-not-allowed"
          >
            Unavailable
          </button>
        </div>
      )}
    </div>
  );
}

function TopupCard({
  topup,
}: {
  topup: {
    topupSku: string;
    displayName: string;
    tokensAmount: number;
    stripeProductId: string | null;
    hasStripePrice: boolean;
    stripePrice: {
      id: string;
      productId: string;
      unitAmount: number | null;
      currency: string;
    } | null;
  };
}) {
  return (
    <div className="pt-6 px-6 pb-8 border border-gray-200 rounded-lg hover:border-orange-300 transition-colors">
      <div className="flex items-center mb-3">
        <Zap className="h-6 w-6 text-orange-500 mr-2" />
        <h3 className="text-xl font-medium text-gray-900">{topup.displayName}</h3>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        {topup.tokensAmount.toLocaleString()} tokens
      </p>
      {topup.stripePrice?.unitAmount ? (
        <>
          <p className="text-3xl font-medium text-gray-900 mb-6">
            ${(topup.stripePrice.unitAmount / 100).toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 mb-6">
            ${((topup.stripePrice.unitAmount / 100) / topup.tokensAmount * 100).toFixed(2)} per 100 tokens
          </p>
        </>
      ) : (
        <p className="text-lg text-gray-500 mb-6">Price not available</p>
      )}
      {topup.stripePrice && topup.hasStripePrice && (
        <form action={topupCheckoutAction}>
          <input type="hidden" name="priceId" value={topup.stripePrice.id} />
          <SubmitButton />
        </form>
      )}
      {!topup.stripePrice || !topup.hasStripePrice && (
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500 mr-1" />
            <p className="text-sm text-gray-500">
              {!topup.stripePrice ? 'Price not configured' : 'Stripe price not found'}
            </p>
          </div>
          <button 
            disabled 
            className="w-full bg-gray-300 text-gray-500 py-2 px-4 rounded cursor-not-allowed"
          >
            Unavailable
          </button>
        </div>
      )}
    </div>
  );
}

// Helper functions
function getFeaturesByPlan(planCode: string): string[] {
  switch (planCode) {
    case 'FREE':
      return [
        '50 tokens per month',
        'Basic ad generation',
        'Email support',
      ];
    case 'STARTER':
      return [
        '300 tokens per month',
        'All ad types',
        'Priority support',
        'Export options',
      ];
    case 'PRO':
      return [
        '1,500 tokens per month',
        'All ad types',
        '24/7 support',
        'Advanced features',
        'Team collaboration',
        'Custom branding',
      ];
    default:
      return [];
  }
}



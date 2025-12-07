'use client';

import { checkoutAction, topupCheckoutAction } from '@/lib/payments/actions';
import { Check, Zap, AlertTriangle } from 'lucide-react';
import { SubmitButton } from './submit-button';
import { useState, useEffect } from 'react';
import useSWR from 'swr';


const fetcher = (url: string) => fetch(url).then((res) => res.json());

type PricingInterval = 'monthly' | 'annually';

interface StripePrice {
  id: string;
  productId: string;
  unitAmount: number | null;
  currency: string;
  interval?: string;
  intervalCount?: number;
}

interface SubscriptionPlan {
  planCode: string;
  displayName: string;
  monthlyTokens: number;
  description: string[];
  stripeProductId: string | null;
  isActive: boolean;
  sortOrder: number;
}

interface TopupPlan {
  topupSku: string;
  displayName: string;
  tokensAmount: number;
  stripeProductId: string | null;
  isActive: boolean;
  sortOrder: number;
}

interface UserWithTokenAccount {
  id: string;
  email: string;
  displayName: string;
  tokenAccount: {
    balance: number;
    planCode: string;
  } | null;
}

export default function PricingPage() {
  const [paymentInterval, setPaymentInterval] = useState<PricingInterval>('monthly');
  
  // Fetch data using SWR for client-side rendering
  const { data: subscriptionPlans = [] } = useSWR<SubscriptionPlan[]>('/api/subscription-plans', fetcher);
  const { data: topupPlans = [] } = useSWR<TopupPlan[]>('/api/topup-plans', fetcher);
  const { data: user } = useSWR<UserWithTokenAccount>('/api/user', fetcher);
  const { data: stripePrices = [] } = useSWR<StripePrice[]>('/api/stripe-prices', fetcher);
  const { data: stripeTopupPrices = [] } = useSWR<StripePrice[]>('/api/stripe-topup-prices', fetcher);

  // Debug logging - simplified
  console.log('🔍 Pricing Page:', {
    plansCount: subscriptionPlans.length,
    pricesCount: stripePrices.length,
    interval: paymentInterval
  });

  // Get user's current plan and balance
  const userBalance = user?.tokenAccount?.balance || 0;
  const currentPlan = user?.tokenAccount?.planCode || 'FREE';
  const hasPaidPlan = currentPlan !== 'FREE';

  // Filter and match subscription plans with their Stripe prices
  const validatedSubscriptionPlans = subscriptionPlans
    .filter(plan => plan.isActive)
    .map(plan => {
      let monthlyPrice: StripePrice | null = null;
      let annualPrice: StripePrice | null = null;
      
      if (plan.stripeProductId) {
        // Find monthly and annual prices for this product
        const prices = stripePrices.filter(sp => sp.productId === plan.stripeProductId);
        
        monthlyPrice = prices.find(p => p.interval === 'month' && p.intervalCount === 1) || null;
        annualPrice = prices.find(p => p.interval === 'year' && p.intervalCount === 1) || null;
        
        // Log only if prices found
        if (monthlyPrice || annualPrice) {
          console.log(`✅ ${plan.planCode} prices found - Monthly: $${monthlyPrice?.unitAmount ? monthlyPrice.unitAmount/100 : 'none'}, Annual: $${annualPrice?.unitAmount ? annualPrice.unitAmount/100 : 'none'}`);
        }
      }
      
      return {
        ...plan,
        description: Array.isArray(plan.description) ? plan.description : [],
        monthlyPrice,
        annualPrice,
        hasStripePrice: !!(monthlyPrice && annualPrice),
        stripePriceId: paymentInterval === 'monthly' ? monthlyPrice?.id : annualPrice?.id
      };
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // Filter plans for current interval
  const getPlansForInterval = (interval: PricingInterval) => {
    return validatedSubscriptionPlans.map(plan => ({
      ...plan,
      stripePriceId: interval === 'monthly' ? plan.monthlyPrice?.id : plan.annualPrice?.id
    }));
  };

  // Match topup plans with their Stripe prices
  const validatedTopupPlans = topupPlans
    .filter(topup => topup.isActive)
    .map(topup => {
      let stripePrice: StripePrice | null = null;
      
      if (topup.stripeProductId) {
        stripePrice = stripeTopupPrices.find(sp => sp.productId === topup.stripeProductId) || null;
      }
      
      return {
        ...topup,
        hasStripePrice: !!stripePrice,
        stripePrice
      };
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const plansForDisplay = getPlansForInterval(paymentInterval);

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            Pick a plan or start creating for free.
          </h1>
          
          {/* Payment Interval Toggle */}
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gray-100 p-1 rounded-lg flex">
              <button
                onClick={() => setPaymentInterval('monthly')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  paymentInterval === 'monthly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Pay monthly
              </button>
              <button
                onClick={() => setPaymentInterval('annually')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  paymentInterval === 'annually'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Pay annually
              </button>
            </div>
          </div>
          
          {paymentInterval === 'annually' && (
            <p className="text-sm text-teal-600 mb-8">
              <span className="font-medium">Save 50%</span> on annual plan
            </p>
          )}
        </div>

        {/* Subscription Plans - Show all 4 plans including FREE */}
        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6 mb-16">
          {/* FREE Plan Card */}
          <PlanCard
            plan={{
              planCode: 'FREE',
              displayName: 'Free',
              monthlyTokens: 50,
              description: ['50 credits per month', 'Basic ad generation', 'Email support'],
              displayPrice: null,
              hasStripePrice: true,
              stripePriceId: null
            }}
            isCurrentPlan={currentPlan === 'FREE'}
            isPopular={false}
            interval={paymentInterval}
          />
          
          {/* Dynamic plans from database */}
          {plansForDisplay
            .filter(plan => plan.planCode !== 'FREE')
            .map((plan, index) => (
              <PlanCard
                key={plan.planCode}
                plan={plan}
                isCurrentPlan={currentPlan === plan.planCode}
                isPopular={plan.planCode === 'GROWTH'} // Make Growth plan popular
                interval={paymentInterval}
              />
            ))}
        </div>

        {/* Token Top-ups - Only show for paid plan users */}
        {hasPaidPlan && (
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
        )}
      </div>
    </main>
  );
}

function PlanCard({
  plan,
  isCurrentPlan,
  isPopular,
  interval,
}: {
  plan: any;
  isCurrentPlan: boolean;
  isPopular: boolean;
  interval: PricingInterval;
}) {
  const features = plan.description || [];
  const stripePriceId = plan.stripePriceId || '';

  // Get the appropriate price based on interval
  const activePrice = interval === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
  const displayAmount = activePrice?.unitAmount ? activePrice.unitAmount / 100 : null;
  
  // Calculate monthly equivalent for annual plans
  const monthlyEquivalent = interval === 'annually' && activePrice?.unitAmount 
    ? Math.round(activePrice.unitAmount / 100 / 12)
    : null;

  // Debug only if no price found
  if (plan.planCode !== 'FREE' && !displayAmount) {
    console.log(`⚠️ No price found for ${plan.planCode}`, { hasStripePrice: plan.hasStripePrice, activePrice });
  }

  return (
    <div className={`relative bg-white rounded-2xl border-2 p-6 ${
      isPopular 
        ? 'border-teal-500 shadow-lg' 
        : isCurrentPlan 
        ? 'border-blue-500' 
        : 'border-gray-200'
    }`}>
      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-teal-500 text-white px-4 py-1 rounded-full text-sm font-medium">
            Most Popular
          </span>
        </div>
      )}

      {/* Current Plan Badge */}
      {isCurrentPlan && !isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
            Current Plan
          </span>
        </div>
      )}

      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-4">{plan.displayName}</h3>
        
        {/* Price */}
        <div className="mb-4">
          {plan.planCode === 'FREE' ? (
            <div className="text-4xl font-bold text-gray-900 mb-2">Free</div>
          ) : displayAmount ? (
            <div>
              <div className="text-4xl font-bold text-teal-600 mb-1">
                ${monthlyEquivalent || displayAmount}
                <span className="text-lg font-normal text-gray-600">/month</span>
              </div>
              {interval === 'annually' && (
                <div className="text-sm text-teal-600 font-medium">
                  ${displayAmount} Billed Yearly
                </div>
              )}
            </div>
          ) : (
            <div className="text-lg text-gray-500 mb-2">Price not available</div>
          )}
        </div>

        <p className="text-gray-600 mb-6 text-sm">
          {plan.planCode === 'FREE' ? 'For individual creators' : 
           plan.planCode === 'STARTER' ? 'For individual creators' :
           plan.planCode === 'GROWTH' ? 'For small businesses and marketers' :
           'Ideal for medium size agencies and marketing teams'}
        </p>

        {/* Features */}
        <div className="text-left mb-6 space-y-3">
          {features.map((feature: string, index: number) => (
            <div key={index} className="flex items-start">
              <Check className="h-4 w-4 text-teal-500 mr-3 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-600">{feature}</span>
            </div>
          ))}
        </div>

        {/* Action Button */}
        {isCurrentPlan ? (
          <button 
            disabled 
            className="w-full bg-gray-100 text-gray-600 py-3 px-4 rounded-lg cursor-not-allowed text-sm font-medium"
          >
            Current Plan
          </button>
        ) : plan.planCode === 'FREE' ? (
          <button 
            disabled 
            className="w-full bg-gray-100 text-gray-600 py-3 px-4 rounded-lg cursor-not-allowed text-sm font-medium"
          >
            Free Plan
          </button>
        ) : stripePriceId && plan.hasStripePrice ? (
          <form action={checkoutAction}>
            <input type="hidden" name="priceId" value={stripePriceId} />
            <SubmitButton />
          </form>
        ) : (
          <button 
            disabled 
            className="w-full bg-gray-300 text-gray-500 py-3 px-4 rounded-lg cursor-not-allowed text-sm font-medium"
          >
            Unavailable
          </button>
        )}
      </div>
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
      {topup.stripePrice && topup.hasStripePrice ? (
        <form action={topupCheckoutAction}>
          <input type="hidden" name="priceId" value={topup.stripePrice.id} />
          <SubmitButton />
        </form>
      ) : (
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
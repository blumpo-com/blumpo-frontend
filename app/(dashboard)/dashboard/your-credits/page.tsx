'use client';

import { checkoutAction, topupCheckoutAction } from '@/lib/payments/actions';
import { Zap } from 'lucide-react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { PricingSection } from '../../pricing-section';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

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
    nextRefillAt: string | null;
    subscriptionStatus: string | null;
  } | null;
}

export default function YourCreditsPage() {
  const { data: user } = useSWR<UserWithTokenAccount>('/api/user', fetcher);
  const { data: subscriptionPlans = [] } = useSWR<SubscriptionPlan[]>('/api/subscription-plans', fetcher);
  const { data: topupPlans = [] } = useSWR<TopupPlan[]>('/api/topup-plans', fetcher);
  const { data: stripePrices = [] } = useSWR<StripePrice[]>('/api/stripe-prices', fetcher);
  const { data: stripeTopupPrices = [] } = useSWR<StripePrice[]>('/api/stripe-topup-prices', fetcher);

  const userBalance = user?.tokenAccount?.balance || 0;
  const currentPlanCode = user?.tokenAccount?.planCode || 'FREE';
  const nextRefillAt = user?.tokenAccount?.nextRefillAt;

  // Get current plan details
  const currentPlan = subscriptionPlans.find(p => p.planCode === currentPlanCode);
  const planTokens = currentPlan?.monthlyTokens || 0;
  const creditsUsed = Math.max(planTokens - userBalance, 0); // Can't be negative
  const creditsTotal = planTokens || 1;
  const progressPercentage = planTokens > 0 ? (creditsUsed / creditsTotal) * 100 : 0;

  // Format renewal date
  const renewalDate = nextRefillAt 
    ? new Date(nextRefillAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  // Map subscription plans to Stripe price IDs
  const planPrices: Record<string, { monthly: string | null; annual: string | null }> = {};
  
  subscriptionPlans.forEach(plan => {
    if (plan.stripeProductId) {
      const prices = stripePrices.filter(sp => sp.productId === plan.stripeProductId);
      const monthly = prices.find(p => p.interval === 'month' && p.intervalCount === 1);
      const annual = prices.find(p => p.interval === 'year' && p.intervalCount === 1);
      planPrices[plan.planCode] = {
        monthly: monthly?.id || null,
        annual: annual?.id || null
      };
    }
  });

  // Get topup plans for "Buy more credits"
  const validatedTopupPlans = topupPlans
    .filter(topup => topup.isActive)
    .map(topup => {
      const stripePrice = topup.stripeProductId
        ? stripeTopupPrices.find(sp => sp.productId === topup.stripeProductId)
        : null;
      return {
        ...topup,
        stripePrice
      };
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);


  return (
    <div className="flex flex-col gap-[82px] h-full items-end pb-[34px] pt-[50px] px-[52px] overflow-y-auto">
      {/* Current Plan Section */}
      <div className="bg-white border-2 border-[#d8d8db] flex flex-col h-[350px] items-center justify-between px-[40px] py-[27px] rounded-[20px] shadow-[0px_2px_7.3px_0px_rgba(0,0,0,0.12)] w-full">
        {/* Header */}
        <div className="flex h-[60px] items-center justify-between w-full">
          <p className="font-semibold leading-[32.684px] text-[#0a0a0a] text-[21.944px] w-[158px]">
            Current plan
          </p>
          <div className="flex flex-col font-medium h-[46px] items-end justify-between leading-[24.824px] text-[16.667px] text-right w-[220px]">
            <p className="text-[#616772] w-[160.833px]">
              Billed monthly
            </p>
            {renewalDate && (
              <p className="text-[#0a0a0a] w-[160.833px]">
                Renews {renewalDate}
              </p>
            )}
          </div>
        </div>

        {/* Plan Details */}
        <div className="border-[#cfd3d8] border-b border-l-0 border-r-0 border-solid border-t flex flex-[1_0_0] items-center justify-between min-h-px min-w-px w-full">
          {/* Plan Icon and Name */}
          <div className="flex gap-[22px] items-center">
            <div 
              className="flex items-center justify-center overflow-clip p-[23px] rounded-[14px] size-[70px]"
              style={{
                backgroundImage: 'linear-gradient(95.82deg, rgba(0, 191, 166, 1) 5.13%, rgba(88, 199, 255, 1) 51.38%, rgba(13, 59, 102, 1) 97.62%)'
              }}
            >
              <Zap className="size-[44px] text-white" />
            </div>
            <p 
              className="font-bold leading-[42.697px] text-[28.667px] w-[111.8px]"
              style={{
                background: 'linear-gradient(104.84deg, rgba(0, 191, 166, 1) 5.13%, rgba(88, 199, 255, 1) 51.38%, rgba(13, 59, 102, 1) 97.62%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              {currentPlan?.displayName || 'Free'}
            </p>
          </div>

          {/* Credits Progress */}
          <div className="flex flex-col gap-[10px] items-start w-[447px]">
            <div className="flex items-start justify-between leading-[29.788px] text-[20px] w-full">
              <p className="font-medium text-[#616772] w-[157px]">
                Ad credits
              </p>
              <p className="font-bold text-[#0a0a0a] text-right w-[157px]">
                {creditsUsed}/{creditsTotal}
              </p>
            </div>
            <div className="bg-[#ebebeb] h-[12px] overflow-clip rounded-[22px] w-full">
              <div 
                className="h-[13px] rounded-[22px]"
                style={{
                  width: `${Math.min(progressPercentage, 100)}%`,
                  backgroundImage: 'linear-gradient(137.05deg, rgba(0, 191, 166, 1) 5.13%, rgba(88, 199, 255, 1) 51.38%, rgba(13, 59, 102, 1) 97.62%)'
                }}
              />
            </div>
          </div>

          {/* Buy More Credits Button */}
          {validatedTopupPlans.length > 0 && validatedTopupPlans[0].stripePrice ? (
            <form action={topupCheckoutAction}>
              <input type="hidden" name="priceId" value={validatedTopupPlans[0].stripePrice.id} />
              <Button
                type="submit"
                className="bg-[#0a0a0a] flex gap-[13px] h-[44px] items-center justify-center px-[14px] py-[8px] rounded-[10px] w-[191px] hover:bg-[#0a0a0a]/90"
              >
                <svg className="size-[25px] text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="font-bold leading-[20px] text-[#f9fafb] text-[16px]">
                  Buy more credits
                </span>
              </Button>
            </form>
          ) : (
            <Button
              disabled
              className="bg-gray-300 flex gap-[13px] h-[44px] items-center justify-center px-[14px] py-[8px] rounded-[10px] w-[191px] cursor-not-allowed"
            >
              <svg className="size-[25px] text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="font-bold leading-[20px] text-gray-500 text-[16px]">
                Buy more credits
              </span>
            </Button>
          )}
        </div>

      </div>

      {/* Upgrade Section */}
      <div className="flex flex-col gap-[27px] items-center w-full">
        <div className="flex flex-col gap-[26px] items-start w-full">
          <p 
            className="font-bold h-[47px] leading-[normal] text-[40px] text-center w-full"
            style={{
              background: 'linear-gradient(111.47deg, rgba(0, 191, 166, 1) 2.43%, rgba(13, 59, 102, 1) 99.10%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            Upgrade your plan to create more ads
          </p>
        </div>
        
        <PricingSection 
          checkoutAction={checkoutAction}
          currentPlanCode={currentPlanCode}
          showEnterprise={false}
          planPrices={planPrices}
        />
      </div>
    </div>
  );
}


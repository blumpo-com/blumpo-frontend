'use client';

import { checkoutAction, topupCheckoutAction } from '@/lib/payments/actions';
import { Zap, Briefcase, Check } from 'lucide-react';
import useSWR from 'swr';
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

  // Get Stripe prices for current plan (for action buttons)
  const currentPlanPrices = currentPlanCode && planPrices[currentPlanCode] 
    ? planPrices[currentPlanCode] 
    : { monthly: null, annual: null };
  const annualPriceId = currentPlanPrices.annual;

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
      <div className="bg-white border-2 border-[#d8d8db] border-solid flex flex-col px-[40px] py-[27px] rounded-[20px] shadow-[0px_2px_7.3px_0px_rgba(0,0,0,0.12)] w-full h-[350px]">
        {/* Header */}
        <div className="flex h-[60px] items-center justify-between w-full shrink-0 mb-0">
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

        {/* Plan Details - Middle Section with Border */}
        <div className="border-[#cfd3d8] border-b border-t border-solid flex items-center justify-between w-full py-6 flex-1 min-h-[167px] overflow-visible">
          {/* Plan Icon and Name - Left */}
          <div className="flex gap-[22px] items-center shrink-0">
            <div 
              className="flex items-center justify-center overflow-clip p-[23px] rounded-[14px] size-[70px] shrink-0"
              style={{
                backgroundImage: 'linear-gradient(95.82deg, rgba(0, 191, 166, 1) 5.13%, rgba(88, 199, 255, 1) 51.38%, rgba(13, 59, 102, 1) 97.62%)'
              }}
            >
              <Zap className="size-[44px] text-white shrink-0" />
            </div>
            <p 
              className="font-bold leading-[42.697px] text-[28.667px] w-[111.8px] shrink-0"
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

          {/* Credits Progress - Center */}
          <div className="flex flex-col gap-[10px] items-start w-[447px] shrink-0 mx-auto">
            <div className="flex items-start justify-between leading-[29.788px] text-[20px] w-full shrink-0">
              <p className="font-medium text-[#616772] w-[157px] shrink-0">
                Ad credits
              </p>
              <p className="font-bold text-[#0a0a0a] text-right w-[157px] shrink-0">
                {creditsUsed}/{creditsTotal}
              </p>
            </div>
            <div className="bg-[#ebebeb] h-[12px] overflow-clip rounded-[22px] w-full relative shrink-0">
              <div 
                className="absolute h-[13px] left-0 rounded-[22px] top-[-0.5px]"
                style={{
                  width: `${Math.min(Math.max(progressPercentage, 0), 100)}%`,
                  minWidth: progressPercentage > 0 ? '4px' : '0px',
                  backgroundImage: 'linear-gradient(137.049909229346deg, rgba(0, 191, 166, 1) 5.1344%, rgba(88, 199, 255, 1) 51.376%, rgba(13, 59, 102, 1) 97.617%)'
                }}
              />
            </div>
          </div>

          {/* Buy More Credits Button - Right */}
          <div className="shrink-0">
            {validatedTopupPlans.length > 0 && validatedTopupPlans[0].stripePrice ? (
              <form action={topupCheckoutAction}>
                <input type="hidden" name="priceId" value={validatedTopupPlans[0].stripePrice.id} />
                <button
                  type="submit"
                  className="bg-[#0a0a0a] flex gap-[13px] h-[44px] items-center justify-center pl-[14px] pr-[8px] py-[8px] rounded-[10px] w-[191px] hover:bg-[#0a0a0a]/90 shrink-0"
                >
                  <svg className="size-[25px] text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="font-bold leading-[20px] text-[#f9fafb] text-[16px] shrink-0">
                    Buy more credits
                  </span>
                </button>
              </form>
            ) : (
              <button
                disabled
                className="bg-gray-300 flex gap-[13px] h-[44px] items-center justify-center pl-[14px] pr-[8px] py-[8px] rounded-[10px] w-[191px] cursor-not-allowed shrink-0"
              >
                <svg className="size-[25px] text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="font-bold leading-[20px] text-gray-500 text-[16px] shrink-0">
                  Buy more credits
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons - Bottom Section */}
        <div className="flex gap-[122px] h-[69px] items-end justify-center relative shrink-0 w-full pt-4">
          {/* Get Annual Plan Button */}
          {annualPriceId ? (
            <form action={checkoutAction}>
              <input type="hidden" name="priceId" value={annualPriceId} />
              <button
                type="submit"
                className="bg-[#0a0a0a] flex h-[50px] items-center justify-center overflow-clip px-[12px] py-[10px] rounded-[10px] w-[223px] hover:bg-[#0a0a0a]/90"
              >
                <span className="font-semibold leading-[normal] text-[#f9fafb] text-[20px] text-center">
                  Get annual plan
                </span>
              </button>
            </form>
          ) : (
            <div className="w-[223px]" />
          )}

          {/* Upgrade Plan Button */}
          <button
            onClick={() => {
              // Scroll to pricing section
              const pricingSection = document.getElementById('pricing-section');
              if (pricingSection) {
                pricingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
            className="bg-white border-2 border-[#0a0a0a] border-solid flex h-[50px] items-center justify-center overflow-clip px-[12px] py-[10px] rounded-[10px] w-[223px] hover:bg-gray-50 shrink-0"
          >
            <span className="font-semibold leading-[normal] text-[#0a0a0a] text-[20px] text-center">
              Upgrade plan
            </span>
          </button>

          {/* Save 50% Badge - positioned relative to action buttons container */}
          {annualPriceId && (
            <div className="absolute bg-[#f9fafb] border border-[#0a0a0a] border-solid flex h-[25px] items-center justify-center overflow-clip px-[5.973px] py-[4.978px] rounded-[25px] left-[283px] top-[59px] w-[75px]">
              <span className="font-semibold leading-[normal] text-[#0a0a0a] text-[12px] text-center">
                Save 50%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Upgrade Section */}
      <div id="pricing-section" className="flex flex-col gap-[27px] items-center w-full">
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

      {/* Enterprise Section */}
      <div className="flex flex-col gap-[27px] items-center w-full">
        <div className="w-full max-w-7xl">
          <div className="border-2 border-solid border-[#d8d8db] rounded-[20px] bg-white shadow-[0px_0px_7px_3px_rgba(0,0,0,0.05)] overflow-hidden">
            <div className="flex flex-col min-[1301px]:flex-row gap-[30px] p-[30px] min-[1301px]:p-[40px]">
              {/* Left Section - Icon, Info, and Button */}
              <div className="flex flex-col gap-[20px] shrink-0 min-[1301px]:w-auto w-full">
                <div className="flex gap-[22px] items-center">
                  <div className="bg-[#00bfa6] p-3 rounded-[8px] size-[38px] min-[1301px]:size-[50px] flex items-center justify-center shrink-0">
                    <Briefcase className="w-6 h-6 min-[1301px]:w-8 min-[1301px]:h-8 text-white" />
                  </div>
                  <div className="flex flex-col gap-[8px]">
                    <h2 className="text-[22px] min-[1301px]:text-[28px] font-bold text-[#0a0a0a] leading-normal">
                      Enterprise
                    </h2>
                    <p className="text-base min-[1301px]:text-lg font-normal text-[#888e98] leading-normal">
                      For big agencies and internal marketing teams - custom integrations
                    </p>
                  </div>
                </div>
                
                {/* Let's talk button in left section */}
                <button 
                  className="bg-[#0a0a0a] h-[45px] min-[1301px]:h-[50px] flex items-center justify-center rounded-[8px] w-full min-[1301px]:w-[191px] cursor-pointer hover:bg-[#0a0a0a]/90 transition-colors"
                  onClick={() => {
                    console.log('Enterprise contact requested');
                    // TODO: Implement enterprise contact form or redirect
                  }}
                >
                  <span className="text-[18px] min-[1301px]:text-[20px] font-bold text-[#f9fafb] leading-normal">
                    Let's talk
                  </span>
                </button>
              </div>

              {/* Right Section - Features in Column */}
              <div className="flex-1 flex flex-col gap-[14px] min-[1301px]:justify-start">
                {[
                  "Everything from Team plan",
                  "10+ users",
                  "Custom integrations",
                ].map((feature, index) => (
                  <div key={index} className="flex gap-[10px] items-center">
                    <div className="size-5 flex-shrink-0">
                      <div className="size-5 rounded-full bg-[#00bfa6] flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                    </div>
                    <span className="text-base font-normal text-[#888e98] leading-normal">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


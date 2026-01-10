'use client';

import { checkoutAction, topupCheckoutAction } from '@/lib/payments/actions';
import { Zap, Briefcase, Check } from 'lucide-react';
import useSWR from 'swr';
import { PricingSection } from '../../pricing-section';
import styles from './page.module.css';

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
    <div className={styles.container}>
      {/* Current Plan Section */}
      <div className={styles.currentPlanSection}>
        {/* Header */}
        <div className={styles.header}>
          <p className={styles.currentPlanTitle}>
            Current plan
          </p>
          <div className={styles.billingInfo}>
            <p className={styles.billedMonthly}>
              Billed monthly
            </p>
            {renewalDate && (
              <p className={styles.renewalDate}>
                Renews {renewalDate}
              </p>
            )}
          </div>
        </div>

        {/* Plan Details - Middle Section with Border */}
        <div className={styles.planDetails}>
          {/* Plan Icon and Name - Left */}
          <div className={styles.planIconName}>
            <div className={styles.planIcon}>
              <Zap className="size-[44px] text-white shrink-0" />
            </div>
            <p className={styles.planName}>
              {currentPlan?.displayName || 'Free'}
            </p>
          </div>

          {/* Credits Progress - Center */}
          <div className={styles.creditsProgress}>
            <div className={styles.creditsHeader}>
              <p className={styles.creditsLabel}>
                Ad credits
              </p>
              <p className={styles.creditsCount}>
                {creditsUsed}/{creditsTotal}
              </p>
            </div>
            <div className={styles.progressBarContainer}>
              <div 
                className={styles.progressBarFill}
                style={{
                  width: `${Math.min(Math.max(progressPercentage, 0), 100)}%`,
                  minWidth: progressPercentage > 0 ? '4px' : '0px',
                }}
              />
            </div>
          </div>

          {/* Buy More Credits Button - Right */}
          <div className={styles.buyCreditsSection}>
            {validatedTopupPlans.length > 0 && validatedTopupPlans[0].stripePrice ? (
              <form action={topupCheckoutAction}>
                <input type="hidden" name="priceId" value={validatedTopupPlans[0].stripePrice.id} />
                <button
                  type="submit"
                  className={styles.buyCreditsButton}
                >
                  <svg className={styles.buyCreditsIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className={styles.buyCreditsText}>
                    Buy more credits
                  </span>
                </button>
              </form>
            ) : (
              <button
                disabled
                className={styles.buyCreditsButtonDisabled}
              >
                <svg className={styles.buyCreditsIconDisabled} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className={styles.buyCreditsTextDisabled}>
                  Buy more credits
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons - Bottom Section */}
        <div className={styles.actionButtons}>
          {/* Get Annual Plan Button */}
          {annualPriceId ? (
            <form action={checkoutAction}>
              <input type="hidden" name="priceId" value={annualPriceId} />
              <button
                type="submit"
                className={styles.annualPlanButton}
              >
                <span className={styles.annualPlanButtonText}>
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
            className={styles.upgradePlanButton}
          >
            <span className={styles.upgradePlanButtonText}>
              Upgrade plan
            </span>
          </button>

          {/* Save 50% Badge - positioned relative to action buttons container */}
          {annualPriceId && (
            <div className={styles.saveBadge}>
              <span className={styles.saveBadgeText}>
                Save 50%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Upgrade Section */}
      <div id="pricing-section" className={styles.upgradeSection}>
        <div className={styles.upgradeTitleContainer}>
          <p className={styles.upgradeTitle}>
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
      <div className={styles.enterpriseSection}>
        <div className={styles.enterpriseCardContainer}>
          <div className={styles.enterpriseCard}>
            <div className={styles.enterpriseCardContent}>
              {/* Left Section - Icon, Info, and Button */}
              <div className={styles.enterpriseLeftSection}>
                <div className={styles.enterpriseHeader}>
                  <div className={styles.enterpriseIcon}>
                    <Briefcase className={styles.enterpriseIconWhite} />
                  </div>
                  <div className={styles.enterpriseInfo}>
                    <h2 className={styles.enterpriseTitle}>
                      Enterprise
                    </h2>
                    <p className={styles.enterpriseDescription}>
                      For big agencies and internal marketing teams - custom integrations
                    </p>
                  </div>
                </div>
                
                {/* Let's talk button in left section */}
                <button 
                  className={styles.enterpriseButton}
                  onClick={() => {
                    console.log('Enterprise contact requested');
                    // TODO: Implement enterprise contact form or redirect
                  }}
                >
                  <span className={styles.enterpriseButtonText}>
                    Let's talk
                  </span>
                </button>
              </div>

              {/* Right Section - Features in Column */}
              <div className={styles.enterpriseRightSection}>
                {[
                  "Everything from Team plan",
                  "10+ users",
                  "Custom integrations",
                ].map((feature, index) => (
                  <div key={index} className={styles.enterpriseFeature}>
                    <div className={styles.enterpriseFeatureCheck}>
                      <div className={styles.enterpriseFeatureCheckCircle}>
                        <Check className={styles.enterpriseFeatureCheckIcon} strokeWidth={3} />
                      </div>
                    </div>
                    <span className={styles.enterpriseFeatureText}>
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


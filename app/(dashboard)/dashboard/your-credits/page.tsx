'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { checkoutAction as originalCheckoutAction, topupCheckoutAction } from '@/lib/payments/actions';
import {Check } from 'lucide-react';
import useSWR from 'swr';
import { PricingSection } from '../../pricing-section';
import { Save50Dialog } from './save-50-dialog';
import { BuyCreditsDialog } from './buy-credits-dialog';
import { ErrorDialog } from '@/components/error-dialog';
import styles from './page.module.css';
import { SubscriptionPeriod } from '@/lib/db/schema/enums';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Icon mapping for plans
const iconMap: Record<string, string> = {
  STARTER: '/assets/icons/bolt.svg',
  GROWTH: '/assets/icons/star.svg',
  TEAM: '/assets/icons/people.svg',
  ENTERPRISE: '/assets/icons/briefcase.svg',
  FREE: '/assets/icons/leaf.svg',
};

// Get icon path based on plan code
const getPlanIcon = (planCode: string): string => {
  return iconMap[planCode] || iconMap.FREE;
};

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
    period: string | null;
  } | null;
}

function YourCreditsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: user } = useSWR<UserWithTokenAccount>('/api/user', fetcher);
  const { data: subscriptionPlans = [] } = useSWR<SubscriptionPlan[]>('/api/subscription-plans', fetcher);
  const { data: topupPlans = [] } = useSWR<TopupPlan[]>('/api/topup-plans', fetcher);
  const { data: stripePrices = [] } = useSWR<StripePrice[]>('/api/stripe-prices', fetcher);
  const { data: stripeTopupPrices = [] } = useSWR<StripePrice[]>('/api/stripe-topup-prices', fetcher);

  const [save50DialogOpen, setSave50DialogOpen] = useState(false);
  const [save50DialogData, setSave50DialogData] = useState<{
    monthlyPrice: number;
    annualPrice: number;
    annualPriceId: string;
    monthlyPriceId: string;
  } | null>(null);
  const [buyCreditsDialogOpen, setBuyCreditsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasProcessedPlan, setHasProcessedPlan] = useState(false);
  const [errorDialog, setErrorDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    errorCode: string | null;
  }>({
    open: false,
    title: 'Error',
    message: '',
    errorCode: null,
  });

  const userBalance = user?.tokenAccount?.balance || 0;
  const currentPlanCode = user?.tokenAccount?.planCode || 'FREE';
  const nextRefillAt = user?.tokenAccount?.nextRefillAt;

  // Get current plan details
  const currentPlan = subscriptionPlans.find(p => p.planCode === currentPlanCode);
  const planTokens = currentPlan?.monthlyTokens || 0;
  const creditsUsed = Math.max(planTokens - userBalance, 0); // Can't be negative
  const creditsTotal = planTokens || 1;
  const progressPercentage = planTokens > 0 ? (userBalance / creditsTotal) * 100 : 0;
  const period = user?.tokenAccount?.period || 'MONTHLY';

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

  // Wrapper checkoutAction that checks if price is annual or monthly
  const checkoutAction = async (formData: FormData) => {
    const priceId = formData.get('priceId') as string;
    
    if (!priceId) {
      console.error('No price ID provided');
      return;
    }

    // Find the price in stripePrices to check if it's annual or monthly
    const price = stripePrices.find(p => p.id === priceId);
    
    if (!price) {
      console.error('Price not found');
      return;
    }

    // Check if it's annual (interval === 'year' and intervalCount === 1)
    const isAnnual = price.interval === 'year' && price.intervalCount === 1;
    
    if (isAnnual) {
      // If annual, proceed with checkout directly
      setIsLoading(true);
      try {
        await originalCheckoutAction(formData);
      } finally {
        setIsLoading(false);
      }
    } else {
      // If monthly, show dialog to suggest annual plan
      // Find the annual price for the same product
      const annualPrice = stripePrices.find(
        p => p.productId === price.productId && p.interval === 'year' && p.intervalCount === 1
      );

      if (annualPrice && annualPrice.unitAmount) {
        const monthlyAmount = price.unitAmount || 0;
        const annualAmount = annualPrice.unitAmount;
        // Calculate monthly equivalent (annual total / 12) for display
        // Convert from cents to dollars first, then calculate
        const monthlyPriceInDollars = Math.round(monthlyAmount / 100);
        const annualTotalInDollars = Math.round(annualAmount / 100);
        const annualMonthlyEquivalent = Math.round(annualTotalInDollars / 12);

        setSave50DialogData({
          monthlyPrice: monthlyPriceInDollars,
          annualPrice: annualMonthlyEquivalent, // Show monthly equivalent (what they'd pay per month with annual)
          annualPriceId: annualPrice.id,
          monthlyPriceId: priceId,
        });
        setSave50DialogOpen(true);
      } else {
        // If no annual price found, proceed with monthly checkout
        setIsLoading(true);
        try {
          await originalCheckoutAction(formData);
        } finally {
          setIsLoading(false);
        }
      }
    }
  };

  // Handle Save 50% dialog confirm - proceed with annual checkout
  const handleSave50DialogConfirm = async () => {
    if (save50DialogData) {
      const formData = new FormData();
      formData.append('priceId', save50DialogData.annualPriceId);
      setSave50DialogOpen(false);
      setSave50DialogData(null);
      setIsLoading(true);
      try {
        await originalCheckoutAction(formData);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle Save 50% dialog close
  const handleSave50DialogContinue = async () => {
    if (save50DialogData) {
      const formData = new FormData();
      formData.append('priceId', save50DialogData.monthlyPriceId);
      setSave50DialogOpen(false);
      setSave50DialogData(null);
      setIsLoading(true);
      try {
        await originalCheckoutAction(formData);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSave50DialogClose = async () => {
    if (save50DialogData) {
      setSave50DialogOpen(false);
      setSave50DialogData(null);
    }
  };

  // Handle Buy Credits dialog - open when button is clicked
  const handleBuyMoreCreditsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setBuyCreditsDialogOpen(true);
  };

  // Handle Buy Credits purchase
  const handleBuyCredits = async (priceId: string) => {
    const formData = new FormData();
    formData.append('priceId', priceId);
    setBuyCreditsDialogOpen(false);
    setIsLoading(true);
    try {
      await topupCheckoutAction(formData);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Upgrade Plan from Buy Credits dialog
  const handleUpgradePlanFromDialog = () => {
    setBuyCreditsDialogOpen(false);
    const pricingSection = document.getElementById('pricing-section');
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Check for error in URL params and display error dialog
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      // Map error codes to user-friendly messages
      const errorMessages: Record<string, { title: string; message: string }> = {
        checkout_failed: {
          title: 'Checkout Failed',
          message: 'There was an error processing your payment. Please try again or contact support if the problem persists.',
        },
        payment_failed: {
          title: 'Payment Failed',
          message: 'Your payment could not be processed. Please check your payment method and try again.',
        },
        subscription_failed: {
          title: 'Subscription Failed',
          message: 'There was an error setting up your subscription. Please try again or contact support.',
        },
        topup_failed: {
          title: 'Top-up Failed',
          message: 'There was an error processing your credit purchase. Please try again.',
        },
      };

      const errorInfo = errorMessages[errorParam] || {
        title: 'Error',
        message: 'An unexpected error occurred. Please try again or contact support.',
      };

      setErrorDialog({
        open: true,
        title: errorInfo.title,
        message: errorInfo.message,
        errorCode: errorParam,
      });

      // Remove error param from URL
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete('error');
      router.replace(`/dashboard/your-credits${newSearchParams.toString() ? `?${newSearchParams.toString()}` : ''}`, { scroll: false });
    }
  }, [searchParams, router]);

  // Auto-trigger checkout when plan code is in URL params
  useEffect(() => {
    const planCode = searchParams.get('plan');
    if (!planCode) return;
    setIsLoading(true);
    
    // Only process if we have all required data and haven't processed yet
    if (planCode && subscriptionPlans.length > 0 && stripePrices.length > 0 && !hasProcessedPlan) {
      setHasProcessedPlan(true);
      
      // Find the plan by planCode
      const plan = subscriptionPlans.find(p => p.planCode === planCode);
      if (plan && plan.stripeProductId) {
        // Get the interval preference from URL (default to annual if not specified)
        const intervalParam = searchParams.get('interval');
        const preferAnnual = intervalParam !== 'monthly';
        
        // Get the prices for this plan
        const prices = stripePrices.filter(sp => sp.productId === plan.stripeProductId);
        const annualPrice = prices.find(p => p.interval === 'year' && p.intervalCount === 1);
        const monthlyPrice = prices.find(p => p.interval === 'month' && p.intervalCount === 1);
        
        // Select price based on interval preference
        const selectedPrice = preferAnnual 
          ? (annualPrice || monthlyPrice)  // Prefer annual, fallback to monthly
          : (monthlyPrice || annualPrice); // Prefer monthly, fallback to annual
        
        if (selectedPrice) {
          // Remove plan and interval params from URL
          const newSearchParams = new URLSearchParams(searchParams.toString());
          newSearchParams.delete('plan');
          newSearchParams.delete('interval');
          router.replace(`/dashboard/your-credits${newSearchParams.toString() ? `?${newSearchParams.toString()}` : ''}`, { scroll: false });
          
          // Trigger checkout with the selected price
          const formData = new FormData();
          formData.append('priceId', selectedPrice.id);
          
          // Use the checkoutAction logic to handle annual/monthly dialog
          checkoutAction(formData);
        }
        setIsLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, subscriptionPlans, stripePrices, hasProcessedPlan, router]);

  return (
    <div className={styles.container}>
      {/* Loading Overlay */}
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className="spinner"></div>
        </div>
      )}

      {/* Current Plan Section */}
      <div className={styles.currentPlanSection}>
        {/* Header */}
        <div className={styles.header}>
          <p className={styles.currentPlanTitle}>
            Current plan
          </p>
          <div className={styles.billingInfo}>
            <p className={styles.billedMonthly}>
              Billed {period === SubscriptionPeriod.MONTHLY ? 'monthly' : 'yearly'}
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
              <img 
                src={getPlanIcon(currentPlanCode)} 
                alt={`${currentPlan?.displayName || 'Free'} plan icon`}
                className={styles.planIconImage}
              />
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
                {userBalance}/{creditsTotal}
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
            {validatedTopupPlans.length > 0 && currentPlan?.planCode != 'FREE' ? (
              <button
                type="button"
                onClick={handleBuyMoreCreditsClick}
                className={styles.buyCreditsButton}
              >
                <svg className={styles.buyCreditsIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className={styles.buyCreditsText}>
                  Buy more credits
                </span>
              </button>
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
        <div className={`${styles.actionButtons} ${!annualPriceId || period !== SubscriptionPeriod.MONTHLY ? styles.actionButtonsCentered : ''}`}>
          {/* Get Annual Plan Button */}
          {annualPriceId && period === SubscriptionPeriod.MONTHLY ? (
            <form action={checkoutAction} className={styles.annualPlanForm}>
              <input type="hidden" name="priceId" value={annualPriceId} />
              <button
                type="submit"
                className={styles.annualPlanButton}
              >
                <span className={styles.annualPlanButtonText}>
                  Get annual plan
                </span>
              </button>
              {/* Save 50% Badge - positioned over the button */}
              <div className={styles.saveBadge}>
                <span className={styles.saveBadgeText}>
                  Save 50%
                </span>
              </div>
            </form>
          ) : null}

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
                    <img src="/assets/icons/briefcase.svg" alt="Enterprise" className={styles.enterpriseIconImage} />
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

              {/* Divider */}
              <div className={styles.enterpriseDivider} />

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

      {/* Save 50% Dialog */}
      {save50DialogData && (
        <Save50Dialog
          open={save50DialogOpen}
          onClose={handleSave50DialogClose}
          onConfirm={handleSave50DialogConfirm}
          onContinue={handleSave50DialogContinue}
          monthlyPrice={save50DialogData.monthlyPrice}
          annualPrice={save50DialogData.annualPrice}
          annualPriceId={save50DialogData.annualPriceId}
        />
      )}

      {/* Buy Credits Dialog */}
      <BuyCreditsDialog
        open={buyCreditsDialogOpen}
        onClose={() => setBuyCreditsDialogOpen(false)}
        onBuyCredits={handleBuyCredits}
        onUpgradePlan={handleUpgradePlanFromDialog}
        topupPlans={validatedTopupPlans}
      />

      {/* Error Dialog */}
      <ErrorDialog
        open={errorDialog.open}
        onClose={() => setErrorDialog({ ...errorDialog, open: false })}
        title={errorDialog.title}
        message={errorDialog.message}
        errorCode={errorDialog.errorCode}
        primaryActionLabel="OK"
        onPrimaryAction={() => setErrorDialog({ ...errorDialog, open: false })}
      />
    </div>
  );
}

export default function YourCreditsPage() {
  return (
    <Suspense fallback={
      <div className={styles.container}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <div className="spinner"></div>
        </div>
      </div>
    }>
      <YourCreditsPageContent />
    </Suspense>
  );
}


'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Dialog } from '@/components/ui/dialog';
import { PricingSection } from '@/app/(landing)/_sections/pricing-section';
import { EnterprisePlanCard } from '@/components/enterprise-plan-card';
import { Save50Dialog } from '@/components/Save50Dialog';
import { checkoutAction as originalCheckoutAction } from '@/lib/payments/actions';
import { useUser } from '@/lib/contexts/user-context';
import { gtmEvent } from '@/lib/gtm';
import { getGaClientId, hashEmailSha256 } from '@/lib/utils';
import styles from './PricingDialog.module.css';

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

interface WelcomePromotionState {
  eligible: boolean;
  status?: string;
  expiresAt?: string | null;
}

interface PricingDialogProps {
  open: boolean;
  onClose: () => void;
  /** Path for Stripe cancel_url so "back" returns here (e.g. /generating?job_id=xxx). Built by caller to avoid portal context issues. */
  cancelUrlPath?: string | null;
}

export function PricingDialog({ open, onClose, cancelUrlPath: cancelUrlPathProp }: PricingDialogProps) {
  const { user } = useUser();
  const { data: subscriptionPlans = [], isLoading: isLoadingPlans } = useSWR<SubscriptionPlan[]>(
    open ? '/api/subscription-plans' : null,
    fetcher
  );
  const { data: stripePrices = [], isLoading: isLoadingStripePrices } = useSWR<StripePrice[]>(
    open ? '/api/stripe-prices' : null,
    fetcher
  );

  const [welcomePromotion, setWelcomePromotion] = useState<WelcomePromotionState | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const [save50DialogOpen, setSave50DialogOpen] = useState(false);
  const [save50DialogData, setSave50DialogData] = useState<{
    monthlyPrice: number;
    annualPrice: number;
    annualPriceId: string;
    monthlyPriceId: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const currentPlanCode = user?.tokenAccount?.planCode || 'FREE';

  // Fetch welcome promotion when dialog opens; show countdown if active
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch('/api/promotions/welcome-50')
      .then((res) => res.json())
      .then((data: WelcomePromotionState) => {
        if (!cancelled) {
          setWelcomePromotion(data);
          if (data.expiresAt && data.status === 'active') {
            const expires = new Date(data.expiresAt).getTime();
            const update = () => {
              const remaining = Math.max(0, Math.floor((expires - Date.now()) / 1000));
              setCountdownSeconds(remaining);
            };
            update();
          } else {
            setCountdownSeconds(null);
          }
        }
      })
      .catch(() => {
        if (!cancelled) setWelcomePromotion(null);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (countdownSeconds === null || countdownSeconds <= 0) return;
    const t = setInterval(() => {
      setCountdownSeconds((prev) => (prev !== null && prev > 0 ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(t);
  }, [countdownSeconds]);

  const showWelcomeBanner =
    welcomePromotion?.eligible === true &&
    welcomePromotion?.status === 'active' &&
    countdownSeconds !== null &&
    countdownSeconds > 0;

  // Style promocyjne (przekreślone ceny, „/ for the first month”) tylko gdy jest odliczanie i kupon active.
  const showPromoPriceDisplay = showWelcomeBanner;

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const planPrices: Record<string, { monthly: string | null; annual: string | null }> = {};
  subscriptionPlans.forEach((plan) => {
    if (plan.stripeProductId) {
      const prices = stripePrices.filter((sp) => sp.productId === plan.stripeProductId);
      const monthly = prices.find((p) => p.interval === 'month' && p.intervalCount === 1);
      const annual = prices.find((p) => p.interval === 'year' && p.intervalCount === 1);
      planPrices[plan.planCode] = {
        monthly: monthly?.id || null,
        annual: annual?.id || null,
      };
    }
  });

  const formDataWithCancelUrl = (fd: FormData): FormData => {
    const out = new FormData();
    fd.forEach((value, key) => out.append(key, value));
    if (cancelUrlPathProp) out.set('cancelUrl', cancelUrlPathProp);
    return out;
  };

  const checkoutAction = async (formData: FormData) => {
    const priceId = formData.get('priceId') as string;
    if (!priceId) return;

    const price = stripePrices.find((p) => p.id === priceId);
    if (!price) return;

    const matchingPlan = subscriptionPlans.find((p) => p.stripeProductId === price.productId);
    const emailHash = user?.email ? await hashEmailSha256(user.email) : undefined;
    gtmEvent('begin_checkout', {
      plan: matchingPlan?.planCode || 'unknown',
      price_id: priceId,
      mode: 'subscription',
      currency: price.currency || 'usd',
      value: price.unitAmount ? price.unitAmount / 100 : undefined,
      user_id: user?.id ?? undefined,
      ga_client_id: getGaClientId() ?? undefined,
      email_sha256: emailHash,
    });

    const isAnnual = price.interval === 'year' && price.intervalCount === 1;
    const dataToSend = formDataWithCancelUrl(formData);

    if (isAnnual) {
      setIsLoading(true);
      try {
        await originalCheckoutAction(dataToSend);
      } finally {
        setIsLoading(false);
      }
    } else {
      const annualPrice = stripePrices.find(
        (p) => p.productId === price.productId && p.interval === 'year' && p.intervalCount === 1
      );
      if (annualPrice?.unitAmount) {
        const monthlyAmount = price.unitAmount || 0;
        const annualAmount = annualPrice.unitAmount;
        const monthlyPriceInDollars = Math.round(monthlyAmount / 100);
        const annualTotalInDollars = Math.round(annualAmount / 100);
        const annualMonthlyEquivalent = Math.round(annualTotalInDollars / 12);
        setSave50DialogData({
          monthlyPrice: monthlyPriceInDollars,
          annualPrice: annualMonthlyEquivalent,
          annualPriceId: annualPrice.id,
          monthlyPriceId: priceId,
        });
        setSave50DialogOpen(true);
      } else {
        setIsLoading(true);
        try {
          await originalCheckoutAction(dataToSend);
        } finally {
          setIsLoading(false);
        }
      }
    }
  };

  const handleSave50Confirm = async () => {
    if (!save50DialogData) return;
    const formData = new FormData();
    formData.append('priceId', save50DialogData.annualPriceId);
    if (cancelUrlPathProp) formData.set('cancelUrl', cancelUrlPathProp);
    const annualPrice = stripePrices.find((p) => p.id === save50DialogData.annualPriceId);
    const matchingPlan = annualPrice
      ? subscriptionPlans.find((p) => p.stripeProductId === annualPrice.productId)
      : null;
    const annualEmailHash = user?.email ? await hashEmailSha256(user.email) : undefined;
    gtmEvent('begin_checkout', {
      plan: matchingPlan?.planCode || 'unknown',
      price_id: save50DialogData.annualPriceId,
      mode: 'subscription',
      currency: annualPrice?.currency || 'usd',
      value: annualPrice?.unitAmount ? annualPrice.unitAmount / 100 : undefined,
      user_id: user?.id ?? undefined,
      ga_client_id: getGaClientId() ?? undefined,
      email_sha256: annualEmailHash,
    });
    setSave50DialogOpen(false);
    setSave50DialogData(null);
    setIsLoading(true);
    try {
      await originalCheckoutAction(formData);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave50Continue = async () => {
    if (!save50DialogData) return;
    const formData = new FormData();
    formData.append('priceId', save50DialogData.monthlyPriceId);
    if (cancelUrlPathProp) formData.set('cancelUrl', cancelUrlPathProp);
    const monthlyPrice = stripePrices.find((p) => p.id === save50DialogData.monthlyPriceId);
    const matchingPlan = monthlyPrice
      ? subscriptionPlans.find((p) => p.stripeProductId === monthlyPrice.productId)
      : null;
    const monthlyEmailHash = user?.email ? await hashEmailSha256(user.email) : undefined;
    gtmEvent('begin_checkout', {
      plan: matchingPlan?.planCode || 'unknown',
      price_id: save50DialogData.monthlyPriceId,
      mode: 'subscription',
      currency: monthlyPrice?.currency || 'usd',
      value: monthlyPrice?.unitAmount ? monthlyPrice.unitAmount / 100 : undefined,
      user_id: user?.id ?? undefined,
      ga_client_id: getGaClientId() ?? undefined,
      email_sha256: monthlyEmailHash,
    });
    setSave50DialogOpen(false);
    setSave50DialogData(null);
    setIsLoading(true);
    try {
      await originalCheckoutAction(formData);
    } finally {
      setIsLoading(false);
    }
  };

  const isLoadingData = isLoadingPlans || isLoadingStripePrices;

  return (
    <>
      <Dialog open={open} onClose={onClose} contentClassName={styles.dialogContent}>
        <div className={styles.headerRow}>
          <div className={styles.headerRowSpacer} />
          {showWelcomeBanner && countdownSeconds !== null ? (
            <div className={styles.promotionBannerContent}>
              <p className={styles.promotionCountdown}>{formatCountdown(countdownSeconds)}</p>
              <p className={styles.promotionMessage}>
                Use limited time 50% discount for new accounts 🎉
              </p>
              <div className={styles.promotionBadge}>
                <span className={styles.promotionBadgeText}>Save 50% on annual plan</span>
              </div>
            </div>
          ) : (
            <h2 className={styles.headerTitle}>Choose the best plan for you</h2>
          )}
          <div className={styles.headerRowRight}>
            <button
              type="button"
              onClick={onClose}
              className={styles.closeButton}
              aria-label="Close"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className={styles.scrollBody}>
          <div className={styles.contentScaled}>
            <div className={styles.pricingWrapper}>
              {isLoadingData ? (
                <div className="flex justify-center py-12">
                  <div className="spinner" />
                </div>
              ) : (
                <>
                  <PricingSection
                    checkoutAction={checkoutAction}
                    currentPlanCode={currentPlanCode}
                    showEnterprise={false}
                    planPrices={planPrices}
                    initialIsAnnual={false}
                    showPromoPriceDisplay={showPromoPriceDisplay}
                    cancelUrlPath={cancelUrlPathProp}
                  />
                  <EnterprisePlanCard className={styles.enterpriseSectionSpacing} />
                </>
              )}
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 rounded-2xl">
            <div className="spinner" />
          </div>
        )}
      </Dialog>

      {save50DialogData && (
        <Save50Dialog
          open={save50DialogOpen}
          onClose={() => {
            setSave50DialogOpen(false);
            setSave50DialogData(null);
          }}
          onConfirm={handleSave50Confirm}
          onContinue={handleSave50Continue}
          monthlyPrice={save50DialogData.monthlyPrice}
          annualPrice={save50DialogData.annualPrice}
          annualPriceId={save50DialogData.annualPriceId}
        />
      )}
    </>
  );
}

'use client';

import { Suspense, useState, useEffect } from 'react';
import { useActionState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import { useUser } from '@/lib/contexts/user-context';
import { signOut, updateAccount } from '@/app/(login)/actions';
import { InputRegular } from '@/components/ui/InputRegular';
import { SubscriptionPeriod } from '@/lib/db/schema/enums';
import { Save50Dialog } from '@/components/Save50Dialog';
import { CurrentPlanCard } from './components/CurrentPlanCard';
import { SettingsActionCard } from './components/SettingsActionCard';
import { CancelSubscriptionDialog } from './components/CancelSubscriptionDialog';
import styles from './page.module.css';
import Calendar from '@/assets/icons/Calendar.svg';
import Money from '@/assets/icons/Money.svg';
import Cancel from '@/assets/icons/Cancel-alt.svg';
import Renew from '@/assets/icons/Renew.svg';
import Help from '@/assets/icons/Help.svg';
import Gift from '@/assets/icons/Gift.svg';
import Exit from '@/assets/icons/Exit.svg';

type ProfileFormState = { error?: string; success?: string };

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface SubscriptionPlan {
  planCode: string;
  displayName: string;
  monthlyTokens: number;
  description: string[];
  stripeProductId: string | null;
  isActive: boolean;
  sortOrder: number;
}

interface StripePrice {
  id: string;
  productId: string;
  unitAmount: number | null;
  interval?: string;
  intervalCount?: number;
}


function SettingsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: isLoadingUser } = useUser();
  const { data: subscriptionPlans = [], isLoading: isLoadingPlans } = useSWR<SubscriptionPlan[]>(
    '/api/subscription-plans',
    fetcher
  );
  const { data: stripePrices = [], isLoading: isLoadingStripePrices } = useSWR<StripePrice[]>(
    '/api/stripe-prices',
    fetcher
  );

  const [profileState, formAction, isSavePending] = useActionState<ProfileFormState, FormData>(
    updateAccount,
    {}
  );

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [lastSavedName, setLastSavedName] = useState('');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [save50DialogOpen, setSave50DialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const isLoading = isLoadingUser || isLoadingPlans || isLoadingStripePrices;

  // Sync profile state from user when user loads
  useEffect(() => {
    if (!user) return;
    const d = user.displayName ?? '';
    const e = user.email ?? '';
    setName(d);
    setEmail(e);
    setLastSavedName(d);
  }, [user?.id, user?.displayName, user?.email]);

  // On successful save: revalidate user, update last-saved baseline
  useEffect(() => {
    if (!profileState?.success) return;
    mutate('/api/user');
    setLastSavedName(name);
    // name intentionally from closure (value we just submitted)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileState?.success]);

  // Sync subscription from Stripe when returning from Customer Portal (webhook may not have fired)
  useEffect(() => {
    const from = searchParams.get('from');
    if (from !== 'stripe_portal_cancel' && from !== 'stripe_portal') return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/stripe/sync-subscription', { method: 'POST' });
        const data = await res.json();
        if (!cancelled && res.ok && data.synced) await mutate('/api/user');
      } catch {
        // ignore
      }
      if (!cancelled) router.replace('/dashboard/settings', { scroll: false });
    })();
    return () => { cancelled = true; };
  }, [searchParams, router]);

  const hasChanges = name !== lastSavedName;

  // User data (for subscription section)
  const currentPlanCode = user?.tokenAccount?.planCode || 'FREE';
  const period = user?.tokenAccount?.period as SubscriptionPeriod | null;
  const nextRefillAt = user?.tokenAccount?.nextRefillAt;
  const subscriptionStatus = user?.tokenAccount?.subscriptionStatus;
  const cancellationTime = user?.tokenAccount?.cancellationTime;
  const retentionOfferAppliedAt = user?.tokenAccount?.retentionOfferAppliedAt;
  const retentionDiscountRenewalAt = user?.tokenAccount?.retentionDiscountRenewalAt;

  // Get current plan display name
  const currentPlan = subscriptionPlans.find((p) => p.planCode === currentPlanCode);
  const planDisplayName = currentPlan?.displayName || 'Free Trial';

  const dateFormat: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  };
  const isCancelAtPeriodEnd = subscriptionStatus === 'cancel_at_period_end';
  const renewalLabel = isCancelAtPeriodEnd ? 'Ends' : 'Renews';
  const renewalDate = (() => {
    if (isCancelAtPeriodEnd && cancellationTime) {
      return new Date(cancellationTime).toLocaleDateString('en-US', dateFormat);
    }
    return nextRefillAt
      ? new Date(nextRefillAt).toLocaleDateString('en-US', dateFormat)
      : null;
  })();

  // Check if free plan
  const isFreePlan = currentPlanCode === 'FREE';

  // Billing text
  const billingText = period === SubscriptionPeriod.MONTHLY ? 'monthly' : 'yearly';

  // Show "Get 70% off" only for monthly plan and when offer not yet used
  const showRetentionOffer =
    !isFreePlan &&
    period === SubscriptionPeriod.MONTHLY &&
    !retentionOfferAppliedAt;

  // Show "(70% off)" next to "Renews X" only when next renewal is the discounted one (same cycle)
  const show70Off = (() => {
    if (!retentionDiscountRenewalAt || !nextRefillAt) return false;
    const a = new Date(retentionDiscountRenewalAt).toDateString();
    const b = new Date(nextRefillAt).toDateString();
    return a === b;
  })();

  // Save 50 dialog: monthly vs annual price for current plan (for Upgrade to annual card)
  const save50PriceData = (() => {
    if (!currentPlan?.stripeProductId || !stripePrices.length) return null;
    const prices = stripePrices.filter((p) => p.productId === currentPlan.stripeProductId);
    const monthly = prices.find((p) => p.interval === 'month' && p.intervalCount === 1);
    const annual = prices.find((p) => p.interval === 'year' && p.intervalCount === 1);
    if (!monthly?.unitAmount || !annual?.unitAmount) return null;
    const monthlyPriceDollars = Math.round(monthly.unitAmount / 100);
    const annualTotalCents = annual.unitAmount;
    const annualMonthlyEquivalent = Math.round(annualTotalCents / 100 / 12);
    return { monthlyPrice: monthlyPriceDollars, annualPrice: annualMonthlyEquivalent };
  })();

  async function handleSignOut() {
    await signOut();
    router.push('/');
  }

  async function handleManageBillings() {
    setActionLoading(true);
    let willRedirect = false;
    try {
      const response = await fetch('/api/stripe/customer-portal?returnTo=settings');
      const data = await response.json();
      if (response.ok && data.url) {
        willRedirect = true;
        window.location.href = data.url;
        return;
      }
      router.push('/dashboard/your-credits');
    } catch (error) {
      console.error('Error opening customer portal:', error);
      router.push('/dashboard/your-credits');
    } finally {
      if (!willRedirect) setActionLoading(false);
    }
  }

  function openCancelDialog() {
    setCancelDialogOpen(true);
  }

  function closeCancelDialog() {
    setCancelDialogOpen(false);
  }

  async function handleAcceptRetentionOffer() {
    setActionLoading(true);
    try {
      const response = await fetch('/api/retention-offer', { method: 'POST' });
      const data = await response.json();
      if (response.ok && data.ok) {
        closeCancelDialog();
        mutate('/api/user');
      } else {
        console.error('Retention offer failed:', data.error);
        closeCancelDialog();
      }
    } catch (err) {
      console.error('Retention offer error:', err);
      closeCancelDialog();
    } finally {
      setActionLoading(false);
    }
  }

  async function handleProceedToCancel() {
    closeCancelDialog();
    setActionLoading(true);
    let willRedirect = false;
    try {
      const response = await fetch('/api/stripe/customer-portal?flow=subscription_cancel');
      const data = await response.json();
      if (response.ok && data.url) {
        willRedirect = true;
        window.location.href = data.url;
        return;
      }
      router.push('/dashboard/your-credits');
    } catch (error) {
      console.error('Error opening customer portal:', error);
      router.push('/dashboard/your-credits');
    } finally {
      if (!willRedirect) setActionLoading(false);
    }
  }

  async function handleRenewSubscription() {
    setActionLoading(true);
    let willRedirect = false;
    try {
      const response = await fetch('/api/stripe/customer-portal?returnTo=settings');
      const data = await response.json();
      if (response.ok && data.url) {
        willRedirect = true;
        window.location.href = data.url;
        return;
      }
      router.push('/dashboard/your-credits');
    } catch (error) {
      console.error('Error opening customer portal:', error);
      router.push('/dashboard/your-credits');
    } finally {
      if (!willRedirect) setActionLoading(false);
    }
  }

  async function handleUpgradeToAnnual() {
    setActionLoading(true);
    let willRedirect = false;
    try {
      const response = await fetch('/api/stripe/customer-portal?flow=subscription_update');
      const data = await response.json();
      if (response.ok && data.url) {
        willRedirect = true;
        window.location.href = data.url;
        return;
      }
      router.push('/dashboard/your-credits');
    } catch (error) {
      console.error('Error opening customer portal:', error);
      router.push('/dashboard/your-credits');
    } finally {
      if (!willRedirect) setActionLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {actionLoading && (
        <div className={styles.actionLoadingOverlay} aria-busy="true" aria-live="polite">
          <div className="spinner" />
        </div>
      )}
      {/* Header */}
      <div className={styles.header}>
        <h1 className="header-gradient-dashboard ">Settings</h1>
        <p className={styles.subtitle}>Customize your profile.</p>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {/* Profile Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Profile</h2>
          <form action={formAction} className={styles.profileForm}>
            <div className={styles.profileInputs}>
              <div className={styles.profileRow}>
                <div className={styles.profileNameField}>
                  <InputRegular
                    label="Name"
                    name="name"
                    value={name}
                    placeholder="Input..."
                    onChange={(v) => setName(v)}
                  />
                </div>
                {hasChanges && (
                  <button
                    type="submit"
                    className={styles.saveButton}
                    disabled={isSavePending || actionLoading}
                  >
                    {isSavePending ? 'Saving...' : 'Save'}
                  </button>
                )}
              </div>
              <InputRegular
                label="Email"
                name="email"
                type="email"
                value={email}
                placeholder="Input..."
                readOnly
              />
            </div>
            {profileState?.error && (
              <p className={styles.profileError}>{profileState.error}</p>
            )}
            {profileState?.success && (
              <p className={styles.profileSuccess}>{profileState.success}</p>
            )}
          </form>
        </div>

        {/* Subscription & Billings Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Subscription & Billings</h2>

          {/* Row 1: Current Plan + Upgrade to Annual */}
          <div className={styles.cardsRow}>
            <CurrentPlanCard
              planCode={currentPlanCode}
              planDisplayName={planDisplayName}
              isFreePlan={isFreePlan}
              billingText={billingText}
              renewalLabel={renewalLabel}
              renewalDate={renewalDate}
              show70Off={show70Off}
              onClick={() => router.push('/dashboard/your-credits')}
            />

            {/* Upgrade to Annual Plan - hidden when FREE or yearly; opens Save50 dialog, redirect on Yes */}
            {!isFreePlan && period !== SubscriptionPeriod.YEARLY ? (
              <SettingsActionCard
                icon={<Calendar />}
                title="Upgrade to annual plan"
                onClick={() => (save50PriceData ? setSave50DialogOpen(true) : handleUpgradeToAnnual())}
              />
            ) : (
              <div className={styles.cardPlaceholder} aria-hidden="true" />
            )}
          </div>

          {/* Row 2: Manage Billings + Cancel/Renew Subscription - hidden when FREE */}
          {!isFreePlan && (
            <div className={styles.cardsRow}>
              <SettingsActionCard
                icon={<Money />}
                title="Manage billings & invoices"
                onClick={handleManageBillings}
              />
              {isCancelAtPeriodEnd ? (
                <SettingsActionCard
                  icon={<Renew />}
                  title="Renew subscription"
                  onClick={handleRenewSubscription}
                />
              ) : (
                <SettingsActionCard
                  icon={<Cancel />}
                  title="Cancel subscription"
                  onClick={openCancelDialog}
                />
              )}
            </div>
          )}
        </div>

        {/* Other Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Other</h2>

          <div className={styles.cardsRow}>
            <SettingsActionCard
              icon={<Help />}
              title="Help & support"
              onClick={() => router.push('/dashboard/support')}
            />
            <SettingsActionCard
              icon={<Gift />}
              title="Refer friends & earn - soon"
              disabled
            />
          </div>
        </div>

        <CancelSubscriptionDialog
          open={cancelDialogOpen}
          onClose={closeCancelDialog}
          onProceedToCancel={handleProceedToCancel}
          onAcceptOffer={handleAcceptRetentionOffer}
          showRetentionOffer={showRetentionOffer}
        />

        {/* Save 50% dialog (Upgrade to annual) */}
        {save50PriceData && (
          <Save50Dialog
            open={save50DialogOpen}
            onClose={() => setSave50DialogOpen(false)}
            onConfirm={() => {
              setSave50DialogOpen(false);
              handleUpgradeToAnnual();
            }}
            onContinue={() => setSave50DialogOpen(false)}
            monthlyPrice={save50PriceData.monthlyPrice}
            annualPrice={save50PriceData.annualPrice}
          />
        )}

        {/* Logout Button */}
        <form action={handleSignOut}>
          <button type="submit" className={styles.logoutButton}>
            <Exit className={styles.logoutIcon} />
            <span className={styles.logoutText}>Logout</span>
          </button>
        </form>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>Settings</h1>
            <p className={styles.subtitle}>Customize your profile.</p>
          </div>
          <div className={styles.loadingContainer}>
            <div className="spinner"></div>
          </div>
        </div>
      }
    >
      <SettingsPageContent />
    </Suspense>
  );
}

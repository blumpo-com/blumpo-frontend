'use client';

import { Suspense, useState, useEffect } from 'react';
import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import { useUser } from '@/lib/contexts/user-context';
import { signOut, updateAccount } from '@/app/(login)/actions';
import { InputRegular } from '@/components/ui/InputRegular';
import { SubscriptionPeriod } from '@/lib/db/schema/enums';
import styles from './page.module.css';
import Calendar from '@/assets/icons/Calendar.svg';
import Money from '@/assets/icons/Money.svg';
import Cancel from '@/assets/icons/Cancel-alt.svg';
import Help from '@/assets/icons/Help.svg';
import Gift from '@/assets/icons/Gift.svg';
import Exit from '@/assets/icons/Exit.svg';
import ChevronRight from '@/assets/icons/Chevron-right.svg';

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


const iconMap: Record<string, string> = {
  STARTER: '/assets/icons/bolt.svg',
  GROWTH: '/assets/icons/star.svg',
  TEAM: '/assets/icons/people.svg',
  ENTERPRISE: '/assets/icons/briefcase.svg',
  FREE: '/assets/icons/leaf.svg',
};

function getPlanIcon(planCode: string): string {
  return iconMap[planCode] || iconMap.FREE;
}

function SettingsPageContent() {
  const router = useRouter();
  const { user, isLoading: isLoadingUser } = useUser();
  const { data: subscriptionPlans = [], isLoading: isLoadingPlans } = useSWR<SubscriptionPlan[]>(
    '/api/subscription-plans',
    fetcher
  );

  const [profileState, formAction, isSavePending] = useActionState<ProfileFormState, FormData>(
    updateAccount,
    {}
  );

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [lastSavedName, setLastSavedName] = useState('');

  const isLoading = isLoadingUser || isLoadingPlans;

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

  const hasChanges = name !== lastSavedName;

  // User data (for subscription section)
  const currentPlanCode = user?.tokenAccount?.planCode || 'FREE';
  const period = user?.tokenAccount?.period as SubscriptionPeriod | null;
  const nextRefillAt = user?.tokenAccount?.nextRefillAt;
 

  // Get current plan display name
  const currentPlan = subscriptionPlans.find((p) => p.planCode === currentPlanCode);
  const planDisplayName = currentPlan?.displayName || 'Free Trial';

  // Format renewal date
  const renewalDate = nextRefillAt
    ? new Date(nextRefillAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  // Check if free plan
  const isFreePlan = currentPlanCode === 'FREE';

  // Billing text
  const billingText = period === SubscriptionPeriod.MONTHLY ? 'monthly' : 'yearly';

  async function handleSignOut() {
    await signOut();
    router.push('/');
  }

  async function handleManageBillings() {
    try {
      const response = await fetch('/api/stripe/customer-portal');
      const data = await response.json();
      
      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        // If no Stripe account, redirect to your-credits
        router.push('/dashboard/your-credits');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      router.push('/dashboard/your-credits');
    }
  }

  async function handleCancelSubscription() {
    // Use Customer Portal with flow_data to directly open subscription cancel page
    try {
      const response = await fetch('/api/stripe/customer-portal?flow=subscription_cancel');
      const data = await response.json();
      
      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        router.push('/dashboard/your-credits');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      router.push('/dashboard/your-credits');
    }
  }

  async function handleUpgradeToAnnual() {
    // Use Customer Portal with flow_data to directly open subscription update page
    try {
      const response = await fetch('/api/stripe/customer-portal?flow=subscription_update');
      const data = await response.json();
      
      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        router.push('/dashboard/your-credits');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      router.push('/dashboard/your-credits');
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
                    disabled={isSavePending}
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
            {/* Current Plan Card */}
            <div
              className={`${styles.card} ${styles.clickable}`}
              onClick={() => router.push('/dashboard/your-credits')}
            >
              <div className={styles.cardContent}>
                <div className={styles.planIconWrapper}>
                  <img
                    src={getPlanIcon(currentPlanCode)}
                    alt={`${planDisplayName} plan icon`}
                    className={styles.planIcon}
                  />
                </div>
                <span className={styles.planName}>{planDisplayName}</span>
              </div>
              <div className={styles.planInfo}>
                {isFreePlan ? (
                  <span className={styles.planBilling}>Free Trial</span>
                ) : (
                  <>
                    <span className={styles.planBilling}>Billed {billingText}</span>
                    {renewalDate && <span className={styles.planRenewal}>Renews {renewalDate}</span>}
                  </>
                )}
              </div>
            </div>

            {/* Upgrade to Annual Plan */}
            <div
              className={`${styles.card} ${styles.clickable}`}
              onClick={handleUpgradeToAnnual}
            >
              <div className={styles.cardContent}>
                <div className={styles.cardIconWrapper}>
                  <Calendar className={styles.cardIcon} />
                </div>
                <span className={styles.cardTitle}>Upgrade to annual plan</span>
              </div>
              <div className={styles.chevronButton}>
                <div className={styles.chevronCircle}>
                  <ChevronRight className={styles.chevronIcon} />
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Manage Billings + Cancel Subscription */}
          <div className={styles.cardsRow}>
            {/* Manage Billings & Invoices */}
            <div
              className={`${styles.card} ${styles.clickable}`}
              onClick={handleManageBillings}
            >
              <div className={styles.cardContent}>
                <div className={styles.cardIconWrapper}>
                  <Money className={styles.cardIcon} />
                </div>
                <span className={styles.cardTitle}>Manage billings & invoices</span>
              </div>
              <div className={styles.chevronButton}>
                <div className={styles.chevronCircle}>
                  <ChevronRight className={styles.chevronIcon} />
                </div>
              </div>
            </div>

            {/* Cancel Subscription */}
            <div
              className={`${styles.card} ${styles.clickable}`}
              onClick={handleCancelSubscription}
            >
              <div className={styles.cardContent}>
                <div className={styles.cardIconWrapper}>
                  <Cancel className={styles.cardIcon} />
                </div>
                <span className={styles.cardTitle}>Cancel subscription</span>
              </div>
              <div className={styles.chevronButton}>
                <div className={styles.chevronCircle}>
                  <ChevronRight className={styles.chevronIcon} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Other Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Other</h2>

          <div className={styles.cardsRow}>
            {/* Help & Support */}
            <div
              className={`${styles.card} ${styles.clickable}`}
              onClick={() => router.push('/dashboard/support')}
            >
              <div className={styles.cardContent}>
                <div className={styles.cardIconWrapper}>
                  <Help className={styles.cardIcon} />
                </div>
                <span className={styles.cardTitle}>Help & support</span>
              </div>
              <div className={styles.chevronButton}>
                <div className={styles.chevronCircle}>
                  <ChevronRight className={styles.chevronIcon} />
                </div>
              </div>
            </div>

            {/* Refer Friends & Earn */}
            <div className={`${styles.card} ${styles.disabled}`}>
              <div className={styles.cardContent}>
                <div className={styles.cardIconWrapper}>
                  <Gift className={styles.cardIcon} />
                </div>
                <span className={styles.cardTitle}>Refer friends & earn - soon</span>
              </div>
              <div className={styles.chevronButton}>
                <div className={styles.chevronCircle}>
                  <ChevronRight className={styles.chevronIcon} />
                </div>
              </div>
            </div>
          </div>
        </div>

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

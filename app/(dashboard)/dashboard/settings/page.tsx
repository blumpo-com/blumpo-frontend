'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { useUser } from '@/lib/contexts/user-context';
import { signOut } from '@/app/(login)/actions';
import { InputRegular } from '@/components/ui/InputRegular';
import { SubscriptionPeriod } from '@/lib/db/schema/enums';
import styles from './page.module.css';

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

// Icons as inline SVGs
function BoltIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 11 17" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.25 0L0 9.5H5V17L11 7.5H6.25V0Z" fill="#F9FAFB" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 29 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M25.375 3.2H23.1875V0H19.8125V3.2H9.1875V0H5.8125V3.2H3.625C1.63125 3.2 0 4.64 0 6.4V28.8C0 30.56 1.63125 32 3.625 32H25.375C27.3688 32 29 30.56 29 28.8V6.4C29 4.64 27.3688 3.2 25.375 3.2ZM25.375 28.8H3.625V11.2H25.375V28.8ZM25.375 8H3.625V6.4H25.375V8ZM7.25 14.4H14.5V20.8H7.25V14.4Z" fill="#0A0A0A" />
    </svg>
  );
}

function MoneyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.16344 0 0 7.16344 0 16C0 24.8366 7.16344 32 16 32C24.8366 32 32 24.8366 32 16C32 7.16344 24.8366 0 16 0ZM17.6 24H14.4V22.4H12.8C11.9163 22.4 11.2 21.6837 11.2 20.8V19.2H14.4V20.8H17.6V17.6H14.4C13.5163 17.6 12.8 16.8837 12.8 16V11.2C12.8 10.3163 13.5163 9.6 14.4 9.6V8H17.6V9.6C18.4837 9.6 19.2 10.3163 19.2 11.2V12.8H16V11.2H14.4V14.4H17.6C18.4837 14.4 19.2 15.1163 19.2 16V20.8C19.2 21.6837 18.4837 22.4 17.6 22.4V24Z" fill="#0A0A0A" />
    </svg>
  );
}

function CancelIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.16344 0 0 7.16344 0 16C0 24.8366 7.16344 32 16 32C24.8366 32 32 24.8366 32 16C32 7.16344 24.8366 0 16 0ZM24 17.6H8V14.4H24V17.6Z" fill="#0A0A0A" />
    </svg>
  );
}

function HelpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.16344 0 0 7.16344 0 16C0 24.8366 7.16344 32 16 32C24.8366 32 32 24.8366 32 16C32 7.16344 24.8366 0 16 0ZM17.6 25.6H14.4V22.4H17.6V25.6ZM20.1787 14.6L18.8787 15.9333C17.8133 17.0133 17.12 17.92 17.12 20.8H14.88V20C14.88 17.92 15.5733 16.16 16.6387 15.08L18.4107 13.2747C18.9547 12.7307 19.28 11.9733 19.28 11.2C19.28 9.5088 17.9152 8.16 16.2 8.16C14.4848 8.16 13.12 9.5088 13.12 11.2H10.88C10.88 8.2736 13.2736 5.92 16.2 5.92C19.1264 5.92 21.52 8.2736 21.52 11.2C21.52 12.496 20.9973 13.6747 20.1787 14.6Z" fill="#0A0A0A" />
    </svg>
  );
}

function GiftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M28.8 8H24.48C24.768 7.392 24.96 6.72 24.96 6C24.96 3.344 22.816 1.2 20.16 1.2C18.528 1.2 17.104 2.032 16.24 3.28L16 3.6L15.76 3.28C14.896 2.032 13.472 1.2 11.84 1.2C9.184 1.2 7.04 3.344 7.04 6C7.04 6.72 7.232 7.392 7.52 8H3.2C1.44 8 0 9.44 0 11.2V14.4C0 15.28 0.72 16 1.6 16H14.4V11.2H17.6V16H30.4C31.28 16 32 15.28 32 14.4V11.2C32 9.44 30.56 8 28.8 8ZM11.84 8C10.72 8 9.84 7.12 9.84 6C9.84 4.88 10.72 4 11.84 4C12.96 4 13.84 4.88 13.84 6V8H11.84ZM20.16 8H18.16V6C18.16 4.88 19.04 4 20.16 4C21.28 4 22.16 4.88 22.16 6C22.16 7.12 21.28 8 20.16 8ZM1.6 19.2V28.8C1.6 30.56 3.04 32 4.8 32H14.4V19.2H1.6ZM17.6 32H27.2C28.96 32 30.4 30.56 30.4 28.8V19.2H17.6V32Z" fill="#0A0A0A" />
    </svg>
  );
}

function ExitIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.5 4.5L12.4425 5.5575L14.6175 7.5H6V9H14.6175L12.4425 10.9425L13.5 12L18 7.5L13.5 4.5Z" fill="#F9FAFB" />
      <path d="M3 3H9V1.5H3C2.175 1.5 1.5 2.175 1.5 3V15C1.5 15.825 2.175 16.5 3 16.5H9V15H3V3Z" fill="#F9FAFB" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 7 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 1L6 7.5L1 14" stroke="#F9FAFB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SettingsPageContent() {
  const router = useRouter();
  const { user, isLoading: isLoadingUser } = useUser();
  const { data: subscriptionPlans = [], isLoading: isLoadingPlans } = useSWR<SubscriptionPlan[]>(
    '/api/subscription-plans',
    fetcher
  );

  const isLoading = isLoadingUser || isLoadingPlans;

  // User data
  const displayName = user?.displayName || '';
  const email = user?.email || '';
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
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.subtitle}>Customize your profile.</p>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {/* Profile Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Profile</h2>
          <div className={styles.profileInputs}>
            <InputRegular label="Name" value={displayName} placeholder="Input..." readOnly />
            <InputRegular label="Email" value={email} placeholder="Input..." readOnly />
          </div>
        </div>

        {/* Subscription & Billings Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Subscription & Billings</h2>

          {/* Row 1: Current Plan + Upgrade to Annual */}
          <div className={styles.cardsRow}>
            {/* Current Plan Card */}
            <div className={styles.card}>
              <div className={styles.cardContent}>
                <div className={styles.planIconWrapper}>
                  <BoltIcon className={styles.planIcon} />
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
              onClick={() => router.push('/dashboard/your-credits')}
            >
              <div className={styles.cardContent}>
                <div className={styles.cardIconWrapper}>
                  <CalendarIcon className={styles.cardIcon} />
                </div>
                <span className={styles.cardTitle}>Upgrade to annual plan</span>
              </div>
              <div className={styles.chevronButton}>
                <div className={styles.chevronCircle}>
                  <ChevronRightIcon className={styles.chevronIcon} />
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Manage Billings + Cancel Subscription */}
          <div className={styles.cardsRow}>
            {/* Manage Billings & Invoices */}
            <div
              className={`${styles.card} ${styles.clickable}`}
              onClick={() => router.push('/dashboard/your-credits')}
            >
              <div className={styles.cardContent}>
                <div className={styles.cardIconWrapper}>
                  <MoneyIcon className={styles.cardIcon} />
                </div>
                <span className={styles.cardTitle}>Manage billings & invoices</span>
              </div>
              <div className={styles.chevronButton}>
                <div className={styles.chevronCircle}>
                  <ChevronRightIcon className={styles.chevronIcon} />
                </div>
              </div>
            </div>

            {/* Cancel Subscription */}
            <div
              className={`${styles.card} ${styles.clickable}`}
              onClick={() => router.push('/dashboard/your-credits')}
            >
              <div className={styles.cardContent}>
                <div className={styles.cardIconWrapper}>
                  <CancelIcon className={styles.cardIcon} />
                </div>
                <span className={styles.cardTitle}>Cancel subscription</span>
              </div>
              <div className={styles.chevronButton}>
                <div className={styles.chevronCircle}>
                  <ChevronRightIcon className={styles.chevronIcon} />
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
                  <HelpIcon className={styles.cardIcon} />
                </div>
                <span className={styles.cardTitle}>Help & support</span>
              </div>
              <div className={styles.chevronButton}>
                <div className={styles.chevronCircle}>
                  <ChevronRightIcon className={styles.chevronIcon} />
                </div>
              </div>
            </div>

            {/* Refer Friends & Earn */}
            <div
              className={`${styles.card} ${styles.clickable}`}
              onClick={() => router.push('/dashboard/your-credits')}
            >
              <div className={styles.cardContent}>
                <div className={styles.cardIconWrapper}>
                  <GiftIcon className={styles.cardIcon} />
                </div>
                <span className={styles.cardTitle}>Refer friends & earn</span>
              </div>
              <div className={styles.chevronButton}>
                <div className={styles.chevronCircle}>
                  <ChevronRightIcon className={styles.chevronIcon} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <form action={handleSignOut}>
          <button type="submit" className={styles.logoutButton}>
            <ExitIcon className={styles.logoutIcon} />
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

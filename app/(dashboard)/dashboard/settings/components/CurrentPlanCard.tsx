'use client';

import styles from './CurrentPlanCard.module.css';

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

export interface CurrentPlanCardProps {
  planCode: string;
  planDisplayName: string;
  isFreePlan: boolean;
  billingText?: string;
  /** Label before date: "Renews" or "Ends" (when cancel_at_period_end) */
  renewalLabel?: 'Renews' | 'Ends';
  renewalDate?: string | null;
  /** Show "(70% off)" next to "Renews X" when coupon applies to next renewal only */
  show70Off?: boolean;
  onClick: () => void;
}

export function CurrentPlanCard({
  planCode,
  planDisplayName,
  isFreePlan,
  billingText = 'monthly',
  renewalLabel = 'Renews',
  renewalDate,
  show70Off = false,
  onClick,
}: CurrentPlanCardProps) {
  return (
    <div className={`${styles.card} ${styles.clickable}`} onClick={onClick}>
      <div className={styles.cardContent}>
        <div className={styles.planIconWrapper}>
          <img
            src={getPlanIcon(planCode)}
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
            {renewalDate && (
              <span className={styles.planRenewal}>
                {renewalLabel} {renewalDate}
                {show70Off && ' (70% off)'}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

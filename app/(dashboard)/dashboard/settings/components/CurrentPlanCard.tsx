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
  renewalDate?: string | null;
  onClick: () => void;
}

export function CurrentPlanCard({
  planCode,
  planDisplayName,
  isFreePlan,
  billingText = 'monthly',
  renewalDate,
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
            {renewalDate && <span className={styles.planRenewal}>Renews {renewalDate}</span>}
          </>
        )}
      </div>
    </div>
  );
}

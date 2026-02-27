'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { SupportCategory } from '@/lib/constants/support-categories';
import { cn } from '@/lib/utils';
import styles from './enterprise-plan-card.module.css';

const ENTERPRISE_FEATURES = [
  'Everything from Team plan',
  '10+ users',
  'Custom integrations',
];

interface EnterprisePlanCardProps {
  className?: string;
}

export function EnterprisePlanCard({ className }: EnterprisePlanCardProps) {
  const router = useRouter();

  return (
    <div className={cn(styles.enterpriseSection, className)}>
      <div className={styles.enterpriseCardContainer}>
        <div className={styles.enterpriseCard}>
          <div className={styles.enterpriseCardContent}>
            <div className={styles.enterpriseLeftSection}>
              <div className={styles.enterpriseHeader}>
                <div className={styles.enterpriseIcon}>
                  <Image
                    src="/assets/icons/briefcase.svg"
                    alt="Enterprise"
                    className={styles.enterpriseIconImage}
                    width={24}
                    height={24}
                  />
                </div>
                <div className={styles.enterpriseInfo}>
                  <h2 className={styles.enterpriseTitle}>Enterprise</h2>
                  <p className={styles.enterpriseDescription}>
                    For big agencies and internal marketing teams - custom integrations
                  </p>
                </div>
              </div>
              <button
                type="button"
                className={styles.enterpriseButton}
                onClick={() => {
                  router.push(
                    `/dashboard/support?category=${encodeURIComponent(SupportCategory.ENTERPRISE_PLAN)}`
                  );
                }}
              >
                <span className={styles.enterpriseButtonText}>Let&apos;s talk</span>
              </button>
            </div>
            <div className={styles.enterpriseDivider} />
            <div className={styles.enterpriseRightSection}>
              {ENTERPRISE_FEATURES.map((feature, index) => (
                <div key={index} className={styles.enterpriseFeature}>
                  <div className={styles.enterpriseFeatureCheck}>
                    <div className={styles.enterpriseFeatureCheckCircle}>
                      <Check className={styles.enterpriseFeatureCheckIcon} strokeWidth={3} />
                    </div>
                  </div>
                  <span className={styles.enterpriseFeatureText}>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { Dialog } from '@/components/ui/dialog';
import styles from './save-50-dialog.module.css';

interface Save50DialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  monthlyPrice: number;
  annualPrice: number;
  annualPriceId: string;
}

export function Save50Dialog({
  open,
  onClose,
  onConfirm,
  monthlyPrice,
  annualPrice,
}: Save50DialogProps) {
  // Calculate annual total (annualPrice is monthly equivalent, so multiply by 12 for total)
  // This is what will be charged today for the full year
  const annualTotal = annualPrice * 12;

  return (
    <Dialog open={open} onClose={onClose} contentClassName={styles.dialogContent}>
      <div className={styles.contentWrapper}>
        {/* Pricing Header */}
        <div className={styles.pricingHeader}>
          <div className={styles.priceComparison}>
            <span className={styles.oldPrice}>${monthlyPrice}</span>
          </div>
          <div className={styles.arrowContainer}>
            <svg
              className={styles.arrow}
              width="41"
              height="25"
              viewBox="0 0 41 25"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10.5 12.5L30.5 12.5M30.5 12.5L25 7M30.5 12.5L25 18"
                stroke="#0a0a0a"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className={styles.newPrice}>${annualPrice}</span>
          {/* Save 50% Badge */}
          <div className={styles.saveBadge}>
            <span className={styles.saveBadgeText}>Save 50%</span>
          </div>
        </div>

          {/* Description Text */}
          <p className={styles.description}>
            Save 50% with annual billing for your plan. You will be billed ${annualTotal} today for the next 12 months (charged once a year).
          </p>

          {/* Action Buttons */}
          <div className={styles.actions}>
            <button
              className={styles.confirmButton}
              onClick={onConfirm}
            >
              <span className={styles.confirmButtonText}>Yes, upgrade</span>
            </button>
            <button
              className={styles.cancelButton}
              onClick={onClose}
            >
              <span className={styles.cancelButtonText}>Cancel</span>
            </button>
          </div>

        {/* Illustration */}
        <div className={styles.illustration}>
          <img
            src="/images/temp/laying_blumpo.png"
            alt="Blumpo character"
            className={styles.illustrationImage}
            onError={(e) => {
              // Fallback if image doesn't exist
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      </div>
    </Dialog>
  );
}


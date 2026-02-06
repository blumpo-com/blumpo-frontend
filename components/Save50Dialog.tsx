'use client';

import Image from 'next/image';
import { Dialog } from '@/components/ui/dialog';
import styles from './Save50Dialog.module.css';

interface Save50DialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onContinue: () => void;
  monthlyPrice: number;
  annualPrice: number;
  annualPriceId?: string;
}

export function Save50Dialog({
  open,
  onClose,
  onConfirm,
  onContinue,
  monthlyPrice,
  annualPrice,
}: Save50DialogProps) {
  const annualTotal = annualPrice * 12;

  return (
    <Dialog open={open} onClose={onClose} contentClassName={styles.dialogContent}>
      <div className={styles.contentWrapper}>
        <div className={styles.pricingHeader}>
          <div className={styles.priceComparison}>
            <span className={styles.oldPrice}>${monthlyPrice}</span>
          </div>
          <div className={styles.arrowContainer}>
            <Image
              src="/assets/icons/arrow.svg"
              alt="Arrow"
              className={styles.arrow}
              width={41}
              height={25}
              draggable={false}
            />
          </div>
          <span className={styles.newPrice}>${annualPrice}</span>
          <div className={styles.saveBadge}>
            <span className={styles.saveBadgeText}>Save 50%</span>
          </div>
        </div>

        <p className={styles.description}>
          Save 50% with annual billing for your plan. You will be billed ${annualTotal} today for the next 12 months (charged once a year).
        </p>

        <div className={styles.actions}>
          <button
            className={styles.confirmButton}
            onClick={onConfirm}
          >
            <span className={styles.confirmButtonText}>Yes, upgrade</span>
          </button>
          <button
            className={styles.cancelButton}
            onClick={onContinue}
          >
            <span className={styles.cancelButtonText}>Continue</span>
          </button>
        </div>

        <div className={styles.illustration}>
          <Image
            src="/images/temp/laying_blumpo.png"
            alt="Blumpo character"
            className={styles.illustrationImage}
            width={200}
            height={120}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      </div>
    </Dialog>
  );
}

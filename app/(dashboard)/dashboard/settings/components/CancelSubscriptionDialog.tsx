'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Dialog } from '@/components/ui/dialog';
import styles from './cancel-subscription-dialog.module.css';

const REASONS = [
  'Too expensive',
  'Hard to use',
  'Limited features',
  'Low quality ads',
  'Prefer other solution',
  'Other',
] as const;

export type CancelReason = (typeof REASONS)[number];

interface CancelSubscriptionDialogProps {
  open: boolean;
  onClose: () => void;
  onProceedToCancel: () => void;
  onAcceptOffer?: () => void;
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="10"
      height="18"
      viewBox="0 0 10 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M1.36 1.36L8.64 8.64L1.36 15.91"
        stroke="currentColor"
        strokeWidth="2.73"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CancelSubscriptionDialog({
  open,
  onClose,
  onProceedToCancel,
  onAcceptOffer,
}: CancelSubscriptionDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} contentClassName={styles.dialogContent}>
      <CancelSubscriptionFlow
        onClose={onClose}
        onProceedToCancel={onProceedToCancel}
        onAcceptOffer={onAcceptOffer}
      />
    </Dialog>
  );
}

function CancelSubscriptionFlow({
  onClose,
  onProceedToCancel,
  onAcceptOffer,
}: {
  onClose: () => void;
  onProceedToCancel: () => void;
  onAcceptOffer?: () => void;
}) {
  const [currentStep, setCurrentStep] = useState<'retention' | 'feedback'>('retention');
  const [reasons, setReasons] = useState<Set<CancelReason>>(new Set());

  const toggleReason = (r: CancelReason) => {
    setReasons((prev) => {
      const next = new Set(prev);
      if (next.has(r)) next.delete(r);
      else next.add(r);
      return next;
    });
  };

  const handleAcceptOffer = () => {
    onAcceptOffer?.();
    onClose();
  };

  const handleCancelLinkRetention = () => {
    setCurrentStep('feedback');
  };

  const handleBack = () => {
    setCurrentStep('retention');
  };

  const handleCancelLinkFeedback = async () => {
    if (reasons.size > 0) {
      try {
        await fetch('/api/cancel-feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reasons: Array.from(reasons) }),
        });
      } catch {
        // ignore
      }
    }
    onProceedToCancel();
  };

  if (currentStep === 'retention') {
    return (
      <div className={styles.contentWrapper}>
        <h2 className={styles.headline}>We don&apos;t want you to leave!</h2>
        <button type="button" className={styles.ctaButton} onClick={handleAcceptOffer}>
          Get 70% off your next month + 200 free credits
        </button>
        <button
          type="button"
          className={styles.cancelLink}
          onClick={handleCancelLinkRetention}
          aria-label="Continue to cancel subscription"
        >
          Cancel subscription
          <ChevronRight className={styles.chevron} />
        </button>
        <div className={styles.illustration}>
          <Image
            src="/images/blumpo/sad-blumpo.png"
            alt=""
            width={180}
            height={180}
            unoptimized
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.feedbackWrapper}>
      <h2 className={styles.feedbackTitle}>Why did you decide to leave Blumpo?</h2>
      <div className={styles.checkboxesGrid}>
        {REASONS.map((r) => (
          <label key={r} className={styles.checkboxLabel}>
            <input
              type="checkbox"
              className={styles.checkboxInput}
              checked={reasons.has(r)}
              onChange={() => toggleReason(r)}
            />
            <span>{r}</span>
          </label>
        ))}
      </div>
      <div className={styles.feedbackActions}>
        <button type="button" className={styles.backButton} onClick={handleBack}>
          Back
        </button>
        <button
          type="button"
          className={styles.cancelLinkRow}
          onClick={handleCancelLinkFeedback}
          aria-label="Cancel subscription"
        >
          Cancel subscription
          <ChevronRight className={styles.chevron} />
        </button>
      </div>
    </div>
  );
}

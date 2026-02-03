'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Dialog } from '@/components/ui/dialog';
import styles from './buy-credits-dialog.module.css';

interface TopupPlanWithPrice {
  topupSku: string;
  displayName: string;
  tokensAmount: number;
  stripeProductId: string | null;
  isActive: boolean;
  sortOrder: number;
  stripePrice?: {
    id: string;
    unitAmount: number | null;
    currency: string;
  } | null;
}

interface BuyCreditsDialogProps {
  open: boolean;
  onClose: () => void;
  onBuyCredits: (priceId: string) => Promise<void>;
  onUpgradePlan: () => void;
  topupPlans: TopupPlanWithPrice[];
}

export function BuyCreditsDialog({
  open,
  onClose,
  onBuyCredits,
  onUpgradePlan,
  topupPlans,
}: BuyCreditsDialogProps) {
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate ads from tokens (assuming 50 tokens per ad)
  const calculateAds = (tokens: number) => Math.floor(tokens / 50);

  // Format price from cents to dollars
  const formatPrice = (unitAmount: number | null) => {
    if (!unitAmount) return 'N/A';
    return `$${Math.round(unitAmount / 100)}`;
  };

  // Calculate discount percentage based on price per token
  const calculateDiscount = (planIndex: number) => {
    if (planIndex === 0 || !topupPlans[0]?.stripePrice?.unitAmount) return null;
    const firstPlanPricePerToken = topupPlans[0].stripePrice.unitAmount / topupPlans[0].tokensAmount;
    const currentPlan = topupPlans[planIndex];
    if (!currentPlan?.stripePrice?.unitAmount) return null;
    const currentPricePerToken = currentPlan.stripePrice.unitAmount / currentPlan.tokensAmount;
    const discount = Math.round(((firstPlanPricePerToken - currentPricePerToken) / firstPlanPricePerToken) * 100);
    return discount > 0 ? discount : null;
  };

  const handleBuyCredits = async () => {
    const selectedPlan = topupPlans[selectedPlanIndex];
    if (!selectedPlan?.stripePrice?.id) {
      console.error('No price ID for selected plan');
      return;
    }

    setIsProcessing(true);
    try {
      await onBuyCredits(selectedPlan.stripePrice.id);
      onClose();
    } catch (error) {
      console.error('Error buying credits:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedPlan = topupPlans[selectedPlanIndex];
  const selectedPrice = selectedPlan?.stripePrice?.unitAmount;

  return (
    <Dialog open={open} onClose={onClose} contentClassName={styles.dialogContent}>
      {/* Main Content */}
      <div className={styles.contentWrapper}>
        {/* Title */}
        <div className={styles.titleContainer}>
          <p className={styles.title}>Buy more credits</p>
        </div>

        {/* Credit Packages */}
        <div className={styles.packagesContainer}>
          {topupPlans.map((plan, index) => {
            const discount = calculateDiscount(index);
            const isSelected = index === selectedPlanIndex;
            const price = formatPrice(plan.stripePrice?.unitAmount || null);
            const ads = calculateAds(plan.tokensAmount);

            return (
              <button
                key={plan.topupSku}
                className={`${styles.creditPackage} ${isSelected ? styles.creditPackageSelected : styles.creditPackageUnselected}`}
                onClick={() => setSelectedPlanIndex(index)}
              >
                <div className={styles.packageContent}>
                  <p className={styles.packagePrice}>{price}</p>
                  <div className={styles.packageDetails}>
                    <p>{plan.tokensAmount.toLocaleString()} credits</p>
                    <p>{ads} ads</p>
                  </div>
                </div>
                {discount && (
                  <div className={styles.discountBadge}>
                    <div className={styles.discountBadgeRotated}>
                      <div className={styles.discountBadgeContent}>
                        <p className={styles.discountBadgeText}>save {discount}%</p>
                      </div>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Buy Credits Button */}
        {selectedPrice && (
          <button
            className={styles.buyCreditsButton}
            onClick={handleBuyCredits}
            disabled={isProcessing}
          >
            <svg className={styles.buyCreditsIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className={styles.buyCreditsButtonText}>Buy credits</span>
          </button>
        )}
      </div>

      {/* Action Buttons - separate section with gap */}
      <div className={styles.actionButtonsWrapper}>
        <div className={styles.actionButtonsRow}>
          <button
            className={styles.upgradeButton}
            onClick={() => {
              onClose();
              onUpgradePlan();
            }}
          >
            <span className={styles.upgradeButtonText}>
              Upgrade plan to get more credits each month
            </span>
          </button>
          <button
            className={styles.cancelButton}
            onClick={onClose}
          >
            <span className={styles.cancelButtonText}>Cancel</span>
          </button>
        </div>
      </div>

      {/* Illustration - positioned at bottom of dialog */}
      <div className={styles.illustration}>
        <Image
          src="/images/temp/laying_blumpo.png"
          alt="Blumpo character"
          className={styles.illustrationImage}
          width={200}
          height={200}
        />
      </div>
    </Dialog>
  );
}


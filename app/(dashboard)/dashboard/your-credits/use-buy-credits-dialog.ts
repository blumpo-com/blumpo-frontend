'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { useUser } from '@/lib/contexts/user-context';
import { topupCheckoutAction } from '@/lib/payments/actions';
import { gtmEvent } from '@/lib/gtm';
import { getGaClientId, hashEmailSha256 } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export interface TopupPlan {
  topupSku: string;
  displayName: string;
  tokensAmount: number;
  stripeProductId: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface StripePrice {
  id: string;
  productId: string;
  unitAmount: number | null;
  currency: string;
}

export interface TopupPlanWithPrice extends TopupPlan {
  stripePrice?: StripePrice | null;
}

export interface UseBuyCreditsDialogOptions {
  /** Called when dialog should close (e.g. setOpen(false)) */
  onClose: () => void;
  /** Called when user clicks "Upgrade plan" in the dialog. Default: no-op. */
  onUpgradePlan?: () => void;
}

export interface UseBuyCreditsDialogReturn {
  topupPlans: TopupPlanWithPrice[];
  onBuyCredits: (priceId: string) => Promise<void>;
  onUpgradePlan: () => void;
  isTopupLoading: boolean;
}

export function useBuyCreditsDialog({
  onClose,
  onUpgradePlan,
}: UseBuyCreditsDialogOptions): UseBuyCreditsDialogReturn {
  const { user } = useUser();
  const [isTopupLoading, setIsTopupLoading] = useState(false);
  const { data: topupPlans = [] } = useSWR<TopupPlan[]>('/api/topup-plans', fetcher);
  const { data: stripeTopupPrices = [] } = useSWR<StripePrice[]>('/api/stripe-topup-prices', fetcher);

  const topupPlansWithPrices: TopupPlanWithPrice[] = topupPlans
    .filter((topup) => topup.isActive)
    .map((topup) => {
      const stripePrice = topup.stripeProductId
        ? stripeTopupPrices.find((sp) => sp.productId === topup.stripeProductId) ?? null
        : null;
      return { ...topup, stripePrice };
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const onBuyCredits = async (priceId: string) => {
    const formData = new FormData();
    formData.append('priceId', priceId);
    const topupPrice = stripeTopupPrices.find((p) => p.id === priceId);
    const matchingTopup = topupPrice
      ? topupPlans.find((t) => t.stripeProductId === topupPrice.productId)
      : null;
    const topupEmailHash = user?.email ? await hashEmailSha256(user.email) : undefined;
    gtmEvent('begin_checkout', {
      plan: matchingTopup?.displayName ?? 'topup',
      price_id: priceId,
      mode: 'payment',
      currency: topupPrice?.currency ?? 'usd',
      value: topupPrice?.unitAmount ? topupPrice.unitAmount / 100 : undefined,
      user_id: user?.id ?? undefined,
      ga_client_id: getGaClientId() ?? undefined,
      email_sha256: topupEmailHash,
    });
    onClose();
    setIsTopupLoading(true);
    try {
      await topupCheckoutAction(formData);
    } finally {
      setIsTopupLoading(false);
    }
  };

  const handleUpgradePlan = () => {
    onClose();
    onUpgradePlan?.();
  };

  return {
    topupPlans: topupPlansWithPrices,
    onBuyCredits,
    onUpgradePlan: handleUpgradePlan,
    isTopupLoading,
  };
}

'use server';

import { redirect } from 'next/navigation';
import { createCheckoutSession, createCustomerPortalSession } from './stripe';
import { withUser } from '@/lib/auth/middleware';

export const checkoutAction = withUser(async (formData, user) => {
  const priceId = formData.get('priceId') as string;
  await createCheckoutSession({ priceId });
});

export const topupCheckoutAction = withUser(async (formData, user) => {
  const priceId = formData.get('priceId') as string;
  await createCheckoutSession({ priceId, isTopup: true });
});

export const customerPortalAction = withUser(async (_, user) => {
  const portalSession = await createCustomerPortalSession(user.id);
  redirect(portalSession.url);
});

export const unsubscribeAction = withUser(async (_, user) => {
  const { cancelUserSubscription } = await import('./stripe');
  await cancelUserSubscription(user.id);
  // Redirect to dashboard with success message
  redirect('/dashboard?unsubscribed=true');
});

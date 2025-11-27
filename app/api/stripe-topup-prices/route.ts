import { getStripeTopupPrices } from '@/lib/payments/stripe';

export async function GET() {
  try {
    const prices = await getStripeTopupPrices();
    return Response.json(prices);
  } catch (error) {
    console.error('Error fetching Stripe topup prices:', error);
    return Response.json({ error: 'Failed to fetch Stripe topup prices' }, { status: 500 });
  }
}
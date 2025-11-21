import { getStripePrices } from '@/lib/payments/stripe';

export async function GET() {
  try {
    const prices = await getStripePrices();
    return Response.json(prices);
  } catch (error) {
    console.error('Error fetching Stripe prices:', error);
    return Response.json({ error: 'Failed to fetch Stripe prices' }, { status: 500 });
  }
}
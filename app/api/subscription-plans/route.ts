import { getSubscriptionPlans } from '@/lib/db/queries';

export async function GET() {
  try {
    const plans = await getSubscriptionPlans();
    return Response.json(plans);
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return Response.json({ error: 'Failed to fetch subscription plans' }, { status: 500 });
  }
}
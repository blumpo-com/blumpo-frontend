import { getTopupPlans } from '@/lib/db/queries';

export async function GET() {
  try {
    const plans = await getTopupPlans();
    return Response.json(plans);
  } catch (error) {
    console.error('Error fetching topup plans:', error);
    return Response.json({ error: 'Failed to fetch topup plans' }, { status: 500 });
  }
}
import Stripe from 'stripe';
import { 
  handleSubscriptionChange, 
  handlePaymentSuccess, 
  handleInvoicePaymentSucceeded,
  stripe 
} from '@/lib/payments/stripe';
import { NextRequest, NextResponse } from 'next/server';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed.', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed.' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        // eslint-disable-next-line no-console
        console.log(`[webhook] ${event.type} sub=${subscription.id} status=${subscription.status} cancel_at_period_end=${!!subscription.cancel_at_period_end}`);
        await handleSubscriptionChange(subscription);
        break;
      }

      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        await handlePaymentSuccess(session);
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  } catch (error) {
    console.error(`Error handling webhook event ${event.type}:`, error);
    return NextResponse.json(
      { error: `Error processing ${event.type}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}

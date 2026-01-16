import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/payments/stripe';
import { db } from '@/lib/db/drizzle';
import { tokenAccount, subscriptionPlan } from '@/lib/db/schema';
import { refillSubscriptionTokens, updateUserSubscription } from '@/lib/db/queries';
import { eq, and, ne, isNotNull } from 'drizzle-orm';
// Using native Date methods instead of date-fns

export async function POST(request: NextRequest) {
  // Security: Check CRON_SECRET authorization
  const authHeader = request.headers.get('Authorization');
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
  
  if (!authHeader || authHeader !== expectedAuth) {
    console.error('Unauthorized refill attempt:', { authHeader });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  let processedCount = 0;
  let errorCount = 0;
  let downgradeCount = 0;
  
  console.log('🔄 Starting subscription refill job...');

  try {
    // Query accounts due for refill with proper locking
    const accountsDue = await db.transaction(async (tx) => {
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

      console.log(`🔍 Querying accounts due before: ${now.toISOString()}`);
      console.log(`🔍 Last refill safety check before: ${threeDaysAgo.toISOString()}`);

      // Select accounts due for refill with row-level locking
      // Use a simpler query to avoid Date object issues
      const accounts = await tx
        .select({
          userId: tokenAccount.userId,
          planCode: tokenAccount.planCode,
          balance: tokenAccount.balance,
          period: tokenAccount.period,
          lastRefillAt: tokenAccount.lastRefillAt,
          nextRefillAt: tokenAccount.nextRefillAt,
          stripeCustomerId: tokenAccount.stripeCustomerId,
          stripeSubscriptionId: tokenAccount.stripeSubscriptionId,
          stripeProductId: tokenAccount.stripeProductId,
          stripePriceId: tokenAccount.stripePriceId,
          subscriptionStatus: tokenAccount.subscriptionStatus,
          cancellationTime: tokenAccount.cancellationTime,
        })
        .from(tokenAccount)
        .where(
          and(
            isNotNull(tokenAccount.stripeSubscriptionId),
            ne(tokenAccount.planCode, 'FREE'),
            isNotNull(tokenAccount.nextRefillAt)
          )
        );

      // Filter in memory for now to avoid Date serialization issues
      const filteredAccounts = accounts.filter(account => {
        if (!account.nextRefillAt) return false;
        
        const nextRefill = new Date(account.nextRefillAt);
        const isdue = nextRefill <= now;
        
        // Check safety buffer (3 days)
        const safetyCheck = !account.lastRefillAt || new Date(account.lastRefillAt) < threeDaysAgo;
        
        return isdue && safetyCheck;
      });

      return filteredAccounts;
    });

    console.log(`📊 Found ${accountsDue.length} accounts due for refill`);

    // Process each account
    for (const account of accountsDue) {
      try {
        await processAccountRefill(account);
        processedCount++;
      } catch (error) {
        console.error(`❌ Failed to process account ${account.userId}:`, error);
        errorCount++;
      }
    }

    const duration = Date.now() - startTime;
    const result = {
      success: true,
      processed: processedCount,
      errors: errorCount,
      downgrades: downgradeCount,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    };

    console.log('✅ Refill job completed:', result);
    return NextResponse.json(result);

  } catch (error) {
    console.error('💥 Refill job failed:', error);
    return NextResponse.json(
      { 
        error: 'Refill job failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        processed: processedCount,
        errors: errorCount,
      }, 
      { status: 500 }
    );
  }

  async function processAccountRefill(account: any) {
    const { userId, stripeSubscriptionId } = account;
    
    console.log(`🔍 Processing account ${userId} with subscription ${stripeSubscriptionId}`);

    // Verify Stripe subscription status
    const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId!, {
      expand: ['latest_invoice'],
    });

    console.log(`📋 Stripe status for ${userId}: ${subscription.status}, cancel_at_period_end: ${subscription.cancel_at_period_end}`);

    // Check if subscription is set to cancel at period end
    if (subscription.cancel_at_period_end === true) {
      console.log(`⬇️ Downgrading ${userId} to FREE (cancel_at_period_end = true)`);
      await downgradeToFree(userId);
      downgradeCount++;
      return;
    }

    // Check if subscription is eligible for refill
    const eligibleStatuses = ['active', 'trialing'];
    if (!eligibleStatuses.includes(subscription.status)) {
      console.log(`⏭️ Skipping ${userId}: ineligible status ${subscription.status}`);
      // Update subscription status in DB but don't add tokens
      await updateUserSubscription(userId, {
        subscriptionStatus: subscription.status,
      });
      return;
    }

    // Optional safety check: verify payment
    const latestInvoice = subscription.latest_invoice as any;
    if (latestInvoice && latestInvoice.paid !== true) {
      console.log(`⏭️ Skipping ${userId}: latest invoice not paid`);
      return;
    }

    // Get subscription plan details
    const plan = await db
      .select()
      .from(subscriptionPlan)
      .where(eq(subscriptionPlan.planCode, account.planCode))
      .limit(1);

    if (plan.length === 0) {
      throw new Error(`Subscription plan not found: ${account.planCode}`);
    }

    const tokensPerPeriod = plan[0].monthlyTokens;
    
    // Generate refill date (YYYY-MM-DD format for idempotency)
    const refillDate = new Date().toISOString().split('T')[0];

    console.log(`💰 Adding ${tokensPerPeriod} tokens to ${userId} for period ${refillDate}`);

    // Use existing refillSubscriptionTokens function for proper idempotency and ledger tracking
    await refillSubscriptionTokens(userId, tokensPerPeriod, refillDate);

    // Update subscription status from Stripe
    await updateUserSubscription(userId, {
      subscriptionStatus: subscription.status,
    });

    console.log(`✅ Successfully refilled ${userId}`);
  }

  async function downgradeToFree(userId: string) {
    await db.transaction(async (tx) => {
      const now = new Date();
      const nextRefill = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

      // Downgrade to FREE plan defaults
      await tx
        .update(tokenAccount)
        .set({
          planCode: 'FREE',
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          stripeProductId: null,
          stripePriceId: null,
          subscriptionStatus: 'canceled',
          lastRefillAt: now,
          nextRefillAt: nextRefill,
          cancellationTime: null, // Clear cancellation time on downgrade
        })
        .where(eq(tokenAccount.userId, userId));

      console.log(`📉 Downgraded ${userId} to FREE plan`);
    });
  }
}
import { NextResponse } from 'next/server';
import { getUser, getUserWithTokenAccount } from '@/lib/db/queries';
import { appendTokenLedgerEntry } from '@/lib/db/queries/tokens';
import { applyRetentionOffer } from '@/lib/payments/stripe';

const RETENTION_CREDITS = 200;
const RETENTION_LEDGER_REFERENCE_PREFIX = 'retention_70_';

export async function POST() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userWithAccount = await getUserWithTokenAccount(user.id);
    const tokenAccount = userWithAccount?.tokenAccount;

    if (!tokenAccount) {
      return NextResponse.json({ error: 'Token account not found' }, { status: 400 });
    }
    if (!tokenAccount.stripeSubscriptionId) {
      return NextResponse.json({ error: 'No active subscription' }, { status: 400 });
    }
    if (tokenAccount.retentionOfferAppliedAt) {
      return NextResponse.json({ error: 'Retention offer already applied' }, { status: 400 });
    }

    // 1) Add 200 credits (idempotent per user)
    await appendTokenLedgerEntry(
      user.id,
      RETENTION_CREDITS,
      'RETENTION_OFFER',
      `${RETENTION_LEDGER_REFERENCE_PREFIX}${user.id}`
    );

    // 2) Apply 70% off coupon to next invoice and set flag
    const result = await applyRetentionOffer(user.id);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Retention offer error:', err);
    return NextResponse.json(
      { error: 'Failed to apply retention offer' },
      { status: 500 }
    );
  }
}

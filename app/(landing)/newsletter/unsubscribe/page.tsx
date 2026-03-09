import Link from 'next/link';
import { CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { verifyUnsubscribeToken } from '@/lib/auth/newsletter-token';
import { removeNewsletterSubscriber } from '@/lib/db/queries/newsletter';
import { unsubscribeNewsletterInBrevo } from '@/lib/brevo';
import { UnsubscribeForm } from './unsubscribe-form';

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function NewsletterUnsubscribePage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (token) {
    const email = await verifyUnsubscribeToken(token);
    if (!email) {
      return <UnsubscribeResult status="expired" />;
    }
    await removeNewsletterSubscriber(email);
    await unsubscribeNewsletterInBrevo(email);
    return <UnsubscribeResult status="success" email={email} />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-20">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 w-full max-w-md">
        <h1 className="text-2xl font-semibold text-[#0a0a0a] mb-3 text-center">
          Unsubscribe from newsletter
        </h1>
        <p className="text-[16px] text-gray-500 mb-6 text-center">
          Enter your email to stop receiving our newsletter.
        </p>
        <UnsubscribeForm />
        <div className="mt-6 text-center">
          <Button asChild variant="ghost" size="sm">
            <Link href="/">Back to Blumpo</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

type UnsubscribeResultStatus = 'success' | 'expired';

function UnsubscribeResult({
  status,
  email,
}: {
  status: UnsubscribeResultStatus;
  email?: string;
}) {
  const isError = status === 'expired';
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-20">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 w-full max-w-md text-center">
        {isError ? (
          <XCircle className="mx-auto mb-5 h-14 w-14 text-red-400" />
        ) : (
          <CheckCircle className="mx-auto mb-5 h-14 w-14 text-emerald-400" />
        )}
        <h1 className="text-2xl font-semibold text-[#0a0a0a] mb-3">
          {status === 'success' ? "You're unsubscribed" : 'Link expired'}
        </h1>
        <p className="text-[16px] text-gray-500 mb-2">
          {status === 'success'
            ? "You won't receive our newsletter anymore."
            : 'This unsubscribe link has expired or is invalid.'}
        </p>
        {email && status === 'success' && (
          <p className="text-[14px] text-gray-400 mb-6">{email}</p>
        )}
        <div className="mt-8">
          <Button asChild variant="cta" className="w-full">
            <Link href="/">Back to Blumpo</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

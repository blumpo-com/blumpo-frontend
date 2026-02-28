import { verifyNewsletterToken } from '@/lib/auth/newsletter-token';
import { isEmailSubscribed, addNewsletterSubscriber } from '@/lib/db/queries/newsletter';
import Link from 'next/link';
import { CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function NewsletterConfirmPage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    return <ConfirmResult status="invalid" />;
  }

  const email = await verifyNewsletterToken(token);

  if (!email) {
    return <ConfirmResult status="expired" />;
  }

  const alreadySubscribed = await isEmailSubscribed(email);

  if (!alreadySubscribed) {
    await addNewsletterSubscriber(email);
  }

  return <ConfirmResult status={alreadySubscribed ? 'already-subscribed' : 'success'} email={email} />;
}

type Status = 'success' | 'already-subscribed' | 'expired' | 'invalid';

const CONTENT: Record<Status, { title: string; description: string; isError: boolean }> = {
  success: {
    title: "You're subscribed!",
    description: "Your email has been confirmed. You'll be the first to hear about new features, tips, and exclusive Blumpo offers.",
    isError: false,
  },
  'already-subscribed': {
    title: 'Already subscribed',
    description: "This email is already on our newsletter list. You're all set — stay tuned for great content!",
    isError: false,
  },
  expired: {
    title: 'Link expired',
    description: 'This confirmation link has expired or is no longer valid. Please submit your email again from our website.',
    isError: true,
  },
  invalid: {
    title: 'Invalid link',
    description: 'This confirmation link is not valid. Please submit your email again from our website.',
    isError: true,
  },
};

function ConfirmResult({ status, email }: { status: Status; email?: string }) {
  const { title, description, isError } = CONTENT[status];

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-20">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 w-full max-w-md text-center">
        {isError ? (
          <XCircle className="mx-auto mb-5 h-14 w-14 text-red-400" />
        ) : (
          <CheckCircle className="mx-auto mb-5 h-14 w-14 text-emerald-400" />
        )}

        <h1 className="text-2xl font-semibold text-[#0a0a0a] mb-3">{title}</h1>

        <p className="text-[16px] text-gray-500 mb-2">{description}</p>

        {email && !isError && (
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

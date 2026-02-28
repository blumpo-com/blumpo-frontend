'use client';

import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export type NewsletterDialogStatus = 'subscribed' | 'email-sent' | 'already-subscribed' | 'error';

interface NewsletterDialogProps {
  status: NewsletterDialogStatus | null;
  onClose: () => void;
}

const DIALOG_CONTENT: Record<NewsletterDialogStatus, { title: string; description: string }> = {
  subscribed: {
    title: "You're in!",
    description: "We've added you to our newsletter. You'll be the first to hear about new features and exclusive offers.",
  },
  'email-sent': {
    title: 'Check your email',
    description: "We've sent a confirmation to your inbox. Welcome to the Blumpo community!",
  },
  'already-subscribed': {
    title: 'Already subscribed',
    description: "This email is already on our newsletter list. Stay tuned for updates!",
  },
  error: {
    title: 'Something went wrong',
    description: 'We could not process your subscription. Please try again later.',
  },
};

export function NewsletterDialog({ status, onClose }: NewsletterDialogProps) {
  const content = status ? DIALOG_CONTENT[status] : null;

  return (
    <Dialog open={!!status} onClose={onClose}>
      {content && (
        <>
          <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '12px', color: '#000' }}>
            {content.title}
          </h2>
          <p style={{ fontSize: '16px', color: '#666', marginBottom: '24px' }}>
            {content.description}
          </p>
          <Button
            onClick={onClose}
            variant="cta"
            style={{ width: '100%', padding: '12px 24px', fontSize: '16px', fontWeight: 500 }}
          >
            Close
          </Button>
        </>
      )}
    </Dialog>
  );
}

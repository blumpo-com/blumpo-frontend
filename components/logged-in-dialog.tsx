'use client';

import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface LoggedInDialogProps {
  open: boolean;
  onClose: () => void;
}

export function LoggedInDialog({ open, onClose }: LoggedInDialogProps) {
  const router = useRouter();

  const handleGoToMainPlatform = () => {
    onClose();
    router.push('/dashboard');
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '16px', color: '#000' }}>
        You are already logged in
      </h2>
      <p style={{ fontSize: '16px', color: '#666', marginBottom: '24px' }}>
        You already have an account with brands. Would you like to go to the main platform?
      </p>
      <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
        <Button
          onClick={handleGoToMainPlatform}
          variant="cta"
          style={{
            width: '100%',
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: 500,
          }}
        >
          Go to main platform
        </Button>
        <Button
          onClick={onClose}
          variant="outline"
          style={{
            width: '100%',
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: 500,
          }}
        >
          Close
        </Button>
      </div>
    </Dialog>
  );
}


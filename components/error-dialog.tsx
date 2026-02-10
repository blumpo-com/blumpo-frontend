'use client';

import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface ErrorDialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  errorCode?: string | null;
  onPrimaryAction?: () => void;
  primaryActionLabel?: string;
  showSecondaryButton?: boolean;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  /** Optional tertiary action (e.g. "See valid images" when FAILED with partial images) */
  onTertiaryAction?: () => void;
  tertiaryActionLabel?: string;
}

export function ErrorDialog({
  open,
  onClose,
  title = 'Error',
  message,
  errorCode,
  onPrimaryAction,
  primaryActionLabel = 'Go Back',
  showSecondaryButton = false,
  secondaryActionLabel = 'Close',
  onSecondaryAction,
  onTertiaryAction,
  tertiaryActionLabel,
}: ErrorDialogProps) {
  const router = useRouter();

  const handlePrimaryAction = () => {
    if (onPrimaryAction) {
      onPrimaryAction();
    } else {
      router.push('/');
    }
    onClose();
  };

  const handleSecondaryAction = () => {
    if (onSecondaryAction) {
      onSecondaryAction();
    }
    onClose();
  };

  // Custom action for INSUFFICIENT_TOKENS - navigate to pricing
  const handleUpgrade = () => {
    router.push('/pricing');
    onClose();
  };

  // Custom action for BRAND_LIMIT_REACHED - navigate to your-credits
  const handleUpgradeToCredits = () => {
    router.push('/dashboard/your-credits');
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '16px', color: '#000' }}>
        {title}
      </h2>
      <p style={{ fontSize: '16px', color: '#666', marginBottom: '24px' }}>
        {message}
      </p>
      {errorCode && errorCode !== 'EXISTING_BRAND' && (
        <p style={{ fontSize: '14px', color: '#999', marginBottom: '24px' }}>
          Error code: {errorCode}
        </p>
      )}
      <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
        {errorCode === 'BRAND_LIMIT_REACHED' ? (
          <>
            <Button
              onClick={handleUpgradeToCredits}
              variant="cta"
              style={{
                width: '100%',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: 500,
              }}
            >
              Upgrade Plan
            </Button>
            <Button
              onClick={handlePrimaryAction}
              variant="outline"
              style={{
                width: '100%',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: 500,
              }}
            >
              {primaryActionLabel}
            </Button>
          </>
        ) : errorCode === 'INSUFFICIENT_TOKENS' ? (
          <>
            <Button
              onClick={handleUpgrade}
              variant="cta"
              style={{
                width: '100%',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: 500,
              }}
            >
              Upgrade Plan
            </Button>
            <Button
              onClick={handlePrimaryAction}
              variant="outline"
              style={{
                width: '100%',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: 500,
              }}
            >
              {primaryActionLabel}
            </Button>
          </>
        ) : onTertiaryAction && tertiaryActionLabel ? (
          <>
            <Button
              onClick={() => {
                onTertiaryAction();
                onClose();
              }}
              variant="cta"
              style={{
                width: '100%',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: 500,
              }}
            >
              {tertiaryActionLabel}
            </Button>
            {onPrimaryAction && (
              <Button
                onClick={handlePrimaryAction}
                variant="outline"
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: 500,
                }}
              >
                {primaryActionLabel}
              </Button>
            )}
            {showSecondaryButton && (
              <Button
                onClick={handleSecondaryAction}
                variant="outline"
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: 500,
                }}
              >
                {secondaryActionLabel}
              </Button>
            )}
          </>
        ) : (
          <>
            <Button
              onClick={handlePrimaryAction}
              variant="cta"
              style={{
                width: '100%',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: 500,
              }}
            >
              {primaryActionLabel}
            </Button>
            {showSecondaryButton && (
              <Button
                onClick={handleSecondaryAction}
                variant="outline"
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: 500,
                }}
              >
                {secondaryActionLabel}
              </Button>
            )}
          </>
        )}
      </div>
    </Dialog>
  );
}


'use client';

import { Dialog } from '@/components/ui/dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import type { VariantProps } from 'class-variance-authority';

type ButtonVariant = VariantProps<typeof buttonVariants>['variant'];
type ButtonSize = VariantProps<typeof buttonVariants>['size'];

interface ButtonConfig {
  label: string;
  onClick: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  style?: React.CSSProperties;
}

interface ErrorDialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  errorCode?: string | null;
  /** Primary button configuration */
  primaryButton?: ButtonConfig;
  /** Secondary button configuration */
  secondaryButton?: ButtonConfig;
  /** Tertiary button configuration (e.g. "See valid images" when FAILED with partial images) */
  tertiaryButton?: ButtonConfig;
}

const defaultButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 24px',
  fontSize: '16px',
  fontWeight: 500,
};

export function ErrorDialog({
  open,
  onClose,
  title = 'Error',
  message,
  errorCode,
  primaryButton,
  secondaryButton,
  tertiaryButton,
}: ErrorDialogProps) {
  const router = useRouter();

  // Default primary button if none provided
  const defaultPrimaryButton: ButtonConfig = {
    label: 'Go Back',
    onClick: () => {
      router.push('/');
      onClose();
    },
    variant: 'cta',
    style: defaultButtonStyle,
  };

  // Use provided primary button or default
  const finalPrimaryButton = primaryButton || defaultPrimaryButton;

  // Build button list (tertiary first, then primary, then secondary)
  const buttons: ButtonConfig[] = [];
  
  if (tertiaryButton) {
    buttons.push({
      ...tertiaryButton,
      onClick: () => {
        tertiaryButton.onClick();
        onClose();
      },
    });
  }
  
  if (finalPrimaryButton) {
    buttons.push({
      ...finalPrimaryButton,
      onClick: () => {
        finalPrimaryButton.onClick();
        onClose();
      },
    });
  }
  
  if (secondaryButton) {
    buttons.push({
      ...secondaryButton,
      onClick: () => {
        secondaryButton.onClick();
        onClose();
      },
    });
  }

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
        {buttons.map((button, index) => (
          <Button
            key={index}
            onClick={button.onClick}
            variant={button.variant || 'cta'}
            size={button.size}
            className={button.className}
            style={button.style || defaultButtonStyle}
          >
            {button.label}
          </Button>
        ))}
      </div>
    </Dialog>
  );
}


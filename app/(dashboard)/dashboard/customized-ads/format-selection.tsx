'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Lock } from 'lucide-react';
import { useUser } from '@/lib/contexts/user-context';
import { ErrorDialog } from '@/components/error-dialog';
import { useRouter } from 'next/navigation';
import styles from './format-selection.module.css';

interface FormatCardProps {
  id: string;
  format: string;
  description: string;
  credits: number;
  socialIcons?: string[];
  formatBoxes?: { label: string; width: string; height: string }[];
  isSelected: boolean;
  disabled?: boolean;
  onClick: () => void;
}

function FormatCard({
  id,
  format,
  description,
  credits,
  socialIcons,
  formatBoxes,
  isSelected,
  disabled = false,
  onClick
}: FormatCardProps) {
  return (
    <button
      className={`${styles.formatCard} ${disabled ? styles.formatCardDisabled : isSelected ? styles.formatCardSelected : styles.gradientBorder}`}
      onClick={onClick}
      type="button"
    >
      {/* Credits Badge */}
      <div className={styles.creditsBadge}>
        <span className={isSelected && !disabled ? styles.creditsBadgeTextSelected : styles.creditsBadgeText}>
          {credits} credits
        </span>
      </div>

      {/* Locked Badge */}
      {disabled && (
        <div className={styles.lockedBadge}>
          <Lock size={12} color="#6b7280" />
          <span className={styles.lockedBadgeText}>Not enough coins</span>
        </div>
      )}

      {/* Format Content */}
      <div className={styles.formatContent}>
        <div className={styles.formatTextContainer}>
          <h3 className={styles.formatText}>{format}</h3>
          <p className={styles.formatDescription}>{description}</p>
        </div>

        {/* Social Icons or Format Boxes */}
        {socialIcons && (
          <div className={styles.socialIconsContainer}>
            {socialIcons.map((iconSrc, index) => (
              <div key={index} className={styles.socialIcon}>
                <Image
                  src={iconSrc}
                  alt={`Social icon ${index + 1}`}
                  className={styles.socialIconImage}
                  width={24}
                  height={24}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {formatBoxes && (
          <div className={styles.formatBoxesContainer}>
            {formatBoxes.map((box, index) => (
              <div
                key={index}
                className={styles.formatBox}
                style={{ width: box.width, height: box.height }}
              >
                <span className={styles.formatBoxText}>{box.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}

interface FormatSelectionContentProps {
  selectedFormat: string;
  onSelectedFormatChange: (format: string) => void;
}

export function FormatSelectionContent({
  selectedFormat,
  onSelectedFormatChange,
}: FormatSelectionContentProps) {
  const router = useRouter();
  const { user } = useUser();
  const [isLowCreditsDialogOpen, setIsLowCreditsDialogOpen] = useState(false);
  const [requiredCredits, setRequiredCredits] = useState(0);

  const tokenBalance = user?.tokenAccount?.balance ?? 0;

  const formats = [
    {
      id: '1:1',
      format: '1:1',
      description: 'Perfect for posts',
      credits: 50,
      socialIcons: [
        '/images/social_media_logo/facebook.png',
        '/images/social_media_logo/instagram.png',
        '/images/social_media_logo/reddit.png',
        '/images/social_media_logo/x.png',
        '/images/social_media_logo/linkedin.png'
      ]
    },
    {
      id: '9:16',
      format: '9:16',
      description: 'Perfect for stories',
      credits: 50,
      socialIcons: [
        '/images/social_media_logo/instagram.png',
        '/images/social_media_logo/facebook.png',
        '/images/social_media_logo/tiktok.png'
      ]
    },
    {
      id: '1:1-9:16',
      format: '1:1 & 9:16',
      description: 'Full package',
      credits: 80,
      formatBoxes: [
        { label: '1:1', width: '107.11px', height: '107.11px' },
        { label: '9:16', width: '73.947px', height: '107.455px' }
      ]
    }
  ];

  return (
    <>
      <div className={styles.formatSelectionContent}>
        {formats.map((format) => {
          const isDisabled = tokenBalance < format.credits;
          return (
            <FormatCard
              key={format.id}
              id={format.id}
              format={format.format}
              description={format.description}
              credits={format.credits}
              socialIcons={format.socialIcons}
              formatBoxes={format.formatBoxes}
              isSelected={selectedFormat === format.id}
              disabled={isDisabled}
              onClick={() => {
                if (isDisabled) {
                  setRequiredCredits(format.credits);
                  setIsLowCreditsDialogOpen(true);
                } else {
                  onSelectedFormatChange(format.id);
                }
              }}
            />
          );
        })}
      </div>

      <ErrorDialog
        open={isLowCreditsDialogOpen}
        onClose={() => setIsLowCreditsDialogOpen(false)}
        title="Not enough coins"
        message={`You need at least ${requiredCredits} coins to use this format. Top up your balance to continue.`}
        primaryButton={{
          label: 'Get more coins',
          onClick: () => router.push('/dashboard/your-credits'),
          variant: 'cta',
        }}
        secondaryButton={{
          label: 'Go Back',
          onClick: () => {},
          variant: 'outline',
        }}
      />
    </>
  );
}


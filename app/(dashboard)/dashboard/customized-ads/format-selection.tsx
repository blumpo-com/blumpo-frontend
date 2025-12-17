'use client';

import styles from './format-selection.module.css';

interface FormatCardProps {
  id: string;
  format: string;
  description: string;
  credits: number;
  socialIcons?: string[];
  formatBoxes?: { label: string; width: string; height: string }[];
  isSelected: boolean;
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
  onClick 
}: FormatCardProps) {
  return (
    <button
      className={`${styles.formatCard} ${isSelected ? styles.formatCardSelected : styles.gradientBorder}`}
      onClick={onClick}
      type="button"
    >
      {/* Credits Badge */}
      <div className={styles.creditsBadge}>
        <span className={isSelected ? styles.creditsBadgeTextSelected : styles.creditsBadgeText}>
          {credits} credits
        </span>
      </div>

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
                <img 
                  src={iconSrc} 
                  alt={`Social icon ${index + 1}`}
                  className={styles.socialIconImage}
                  onError={(e) => {
                    // Fallback for missing icons - show placeholder
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
      id: '16:9',
      format: '16:9',
      description: 'Perfect for stories',
      credits: 50,
      socialIcons: [
        '/images/social_media_logo/instagram.png',
        '/images/social_media_logo/facebook.png',
        '/images/social_media_logo/tiktok.png'
      ]
    },
    {
      id: '1:1-16:9',
      format: '1:1 & 16:9',
      description: 'Full package',
      credits: 80,
      formatBoxes: [
        { label: '1:1', width: '107.11px', height: '107.11px' },
        { label: '16:9', width: '73.947px', height: '107.455px' }
      ]
    }
  ];

  return (
    <div className={styles.formatSelectionContent}>
      {formats.map((format) => (
        <FormatCard
          key={format.id}
          id={format.id}
          format={format.format}
          description={format.description}
          credits={format.credits}
          socialIcons={format.socialIcons}
          formatBoxes={format.formatBoxes}
          isSelected={selectedFormat === format.id}
          onClick={() => onSelectedFormatChange(format.id)}
        />
      ))}
    </div>
  );
}


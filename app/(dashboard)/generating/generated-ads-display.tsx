'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './generated-ads-display.module.css';

interface AdImage {
  id: string;
  title: string | null;
  publicUrl: string;
  width: number | null;
  height: number | null;
  format: string;
  workflowId: string | null;
  archetype: {
    code: string;
    displayName: string;
    description: string | null;
  } | null;
  createdAt: string;
}

interface GeneratedAdsDisplayProps {
  images: AdImage[];
  jobId: string;
}

export function GeneratedAdsDisplay({ images, jobId }: GeneratedAdsDisplayProps) {
  const router = useRouter();
  const [hoveredImageId, setHoveredImageId] = useState<string | null>(null);

  const handleDownload = async (imageUrl: string, imageId: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ad-${imageId}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  const handleGenerateMore = () => {
    router.push('/');
  };

  const handleRegenerate = () => {
    router.push('/');
  };

  // Show first 5 images, 6th is blurred with "?" overlay (if more than 5 images)
  const displayImages = images.slice(0, 6);
  const hasMore = images.length > 5;

  return (
    <div className={styles.container}>
      {/* Left Panel - Generated Ads */}
      <div className={styles.leftPanel}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            Ads crafted for your brand are here 👋
          </h1>
          <p className={styles.subtitle}>
            Hover over and download them for free!
          </p>
        </div>
        
        <div className={styles.imagesGrid}>
          {displayImages.map((image, index) => {
            const isBlurred = index === 5 && hasMore;
            return (
              <div
                key={image.id}
                className={`${styles.imageCard} ${isBlurred ? styles.blurredCard : ''}`}
                onMouseEnter={() => !isBlurred && setHoveredImageId(image.id)}
                onMouseLeave={() => setHoveredImageId(null)}
              >
                <div className={styles.imageWrapper}>
                  <img
                    src={image.publicUrl}
                    alt={image.title || 'Generated ad'}
                    className={styles.image}
                  />
                  {isBlurred && (
                    <div className={styles.blurredOverlay}>
                      <span className={styles.questionMark}>?</span>
                    </div>
                  )}
                  {!isBlurred && hoveredImageId === image.id && (
                    <button
                      className={styles.downloadButton}
                      onClick={() => handleDownload(image.publicUrl, image.id)}
                      aria-label="Download image"
                    >
                      Download
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Panel - Insights & Details */}
      <div className={styles.rightPanel}>
        <div className={styles.insightsSection}>
          <p className={styles.insightsTitle}>
            Insights & components based on your website, Reddit and social media research
          </p>
        </div>

        {/* Brand Components Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Input tag name</h2>
          <div className={styles.brandComponents}>
            <div className={styles.brandComponent}>
              <p className={styles.componentLabel}>Logo</p>
              <div className={styles.componentBox}>
                {/* Logo placeholder - would be populated from brand data */}
                <div className={styles.logoPlaceholder}>Logo</div>
              </div>
            </div>
            <div className={styles.brandComponent}>
              <p className={styles.componentLabel}>Colors</p>
              <div className={styles.colorsBox}>
                {/* Color swatches placeholder */}
                <div className={styles.colorSwatches}>
                  <div className={styles.colorSwatch} style={{ backgroundColor: '#00BFA6' }} />
                  <div className={styles.colorSwatch} style={{ backgroundColor: '#0D3B66' }} />
                </div>
              </div>
            </div>
            <div className={styles.brandComponent}>
              <p className={styles.componentLabel}>Font</p>
              <div className={styles.componentBox}>
                <p className={styles.fontName}>Poppins</p>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.divider} />

        {/* Customer Insights Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Customer insights</h2>
          <div className={styles.insightsGrid}>
            <div className={styles.insightBox}>
              <p className={styles.insightLabel}>Customer pain points</p>
              <div className={styles.insightContent}>
                <ul className={styles.insightList}>
                  <li>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer vitae sem urna. Integer luctus, turpis non pharetra porttitor</li>
                  <li>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer vitae sem urna. Integer luctus, turpis non pharetra porttitor</li>
                  <li>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer vitae sem urna. Integer luctus, turpis non pharetra porttitor</li>
                </ul>
              </div>
            </div>
            <div className={styles.insightBox}>
              <p className={styles.insightLabel}>Customer groups</p>
              <div className={styles.insightContent}>
                <ul className={styles.insightList}>
                  <li>Group First</li>
                  <li>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer vitae sem urna. Integer luctus, turpis non pharetra porttitor</li>
                  <li>Group number 3</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <button className={styles.actionButton} onClick={handleGenerateMore}>
          <span>Generate more ads with Blumpo</span>
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
            <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className={styles.divider} />

        {/* Ad Types Section */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.paidBadge}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1L7.5 4.5L11 6L7.5 7.5L6 11L4.5 7.5L1 6L4.5 4.5L6 1Z" fill="currentColor" />
              </svg>
              <span>Paid only</span>
            </div>
            <h2 className={styles.sectionTitle}>Ad types</h2>
          </div>
          <div className={styles.archetypesGrid}>
            {images
              .map(img => img.archetype)
              .filter((arch, index, self) => arch && self.findIndex(a => a?.code === arch.code) === index)
              .slice(0, 6)
              .map((archetype) => (
                <div key={archetype?.code} className={styles.archetypeCard}>
                  {archetype?.displayName || 'Unknown'}
                </div>
              ))}
          </div>
        </div>

        <div className={styles.divider} />

        {/* Ad Formats Section */}
        <div className={styles.section}>
          <div className={styles.formatsRow}>
            <div className={styles.formatGroup}>
              <div className={styles.sectionHeader}>
                <div className={styles.paidBadge}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 1L7.5 4.5L11 6L7.5 7.5L6 11L4.5 7.5L1 6L4.5 4.5L6 1Z" fill="currentColor" />
                  </svg>
                  <span>Paid only</span>
                </div>
                <h2 className={styles.sectionTitle}>Different ad formats</h2>
              </div>
              <div className={styles.formatBoxes}>
                <div className={styles.formatBox}>1:1</div>
                <div className={styles.formatBox}>16:9</div>
              </div>
            </div>
            <div className={styles.formatGroup}>
              <div className={styles.sectionHeader}>
                <div className={styles.paidBadge}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 1L7.5 4.5L11 6L7.5 7.5L6 11L4.5 7.5L1 6L4.5 4.5L6 1Z" fill="currentColor" />
                  </svg>
                  <span>Paid only</span>
                </div>
                <h2 className={styles.sectionTitle}>Language</h2>
              </div>
              <div className={styles.languageBox}>
                <span>🇬🇧 English</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.divider} />

        <button className={styles.actionButton} onClick={handleRegenerate}>
          <span>Regenerate ads</span>
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
            <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}


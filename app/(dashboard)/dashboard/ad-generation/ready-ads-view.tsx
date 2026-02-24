'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from './ready-ads-view.module.css';

// Use NEXT_PUBLIC_ prefix for client-side access
const IS_TEST_MODE = process.env.NEXT_PUBLIC_IS_TEST_MODE === 'true';

interface ReadyAdsViewProps {
  onSeeAds?: () => void;
  jobId?: string;
}

export function ReadyAdsView({ onSeeAds, jobId }: ReadyAdsViewProps) {
  const router = useRouter();

  const handleSeeAdsClick = async () => {
    // Mark job as viewed when "See ads" is clicked
    if (jobId) {
      try {
        await fetch(`/api/generation-jobs/${jobId}/viewed`, {
          method: 'POST',
        });
        // Dispatch custom event to notify generation status panel
        window.dispatchEvent(new CustomEvent('generation-job-viewed', { detail: { jobId } }));
      } catch (error) {
        console.error('Error marking job as viewed:', error);
        // Continue with navigation even if marking fails
      }
    }

    // Call the original onSeeAds callback if provided
    if (onSeeAds) {
      onSeeAds();
    }
  };

  // Test buttons for different formats - only show in test mode
  const handleTestFormat = (format: '1:1' | '9:16' | 'mixed') => {
    if (IS_TEST_MODE) {
      router.push(`/dashboard/ad-generation/ad-review-view?format=${format}&test=true`);
    }
  };

  return (
    <div className={styles.container}>
      {/* Test buttons row - only show in test mode, positioned absolutely */}
      {IS_TEST_MODE && (
        <div className={styles.testButtonsRow}>
          <button
            onClick={() => handleTestFormat('1:1')}
            className={styles.testButton}
            style={{ backgroundColor: '#ff6b6b' }}
          >
            TEST: 1:1 Format
          </button>
          <button
            onClick={() => handleTestFormat('9:16')}
            className={styles.testButton}
            style={{ backgroundColor: '#4ecdc4' }}
          >
            TEST: 9:16 Format
          </button>
          <button
            onClick={() => handleTestFormat('mixed')}
            className={styles.testButton}
            style={{ backgroundColor: '#95e1d3' }}
          >
            TEST: Mixed Format
          </button>
        </div>
      )}

      <div className={styles.content}>
        {/* Header Section */}
        <div className={styles.header}>
          <h1 className={styles.title}>
            <span className={styles.titleText}>Your ads are ready</span> 😎
          </h1>
          <p className={styles.subtitle}>We can't wait to show them to you!</p>
        </div>

        {/* Button and Image Section */}
        <div className={styles.bottomSection}>
          <button className={styles.seeAdsButton} onClick={handleSeeAdsClick}>
            <span className={styles.buttonText}>See ads</span>
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={styles.arrowIcon}
            >
              <path
                d="M9 18L15 12L9 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Blumpo Image */}
          <div className={styles.imageContainer}>
            <Image
              src="/assets/animations/lying-blumpo.webp"
              alt="Blumpo character"
              width={687}
              height={500}
              className={styles.blumpoImage}
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import Image from 'next/image';
import styles from './ready-ads-view.module.css';

interface ReadyAdsViewProps {
  onSeeAds?: () => void;
  jobId?: string;
}

export function ReadyAdsView({ onSeeAds, jobId }: ReadyAdsViewProps) {
  const handleSeeAdsClick = async () => {
    if (jobId) {
      try {
        await fetch(`/api/generation-jobs/${jobId}/viewed`, {
          method: 'POST',
        });
        window.dispatchEvent(new CustomEvent('generation-job-viewed', { detail: { jobId } }));
      } catch (error) {
        console.error('Error marking job as viewed:', error);
      }
    }
    onSeeAds?.();
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            <span className={styles.titleText}>Your ads are ready</span> 😎
          </h1>
          <p className={styles.subtitle}>We can&apos;t wait to show them to you!</p>
        </div>

        <div className={styles.bottomSection}>
          <div className={styles.imageContainer}>
            <Image
              src="/assets/animations/lying-blumpo.webp"
              alt="Blumpo character"
              width={600}
              height={600}
              className={styles.blumpoImage}
              priority
            />
          </div>
          <button type="button" className={styles.seeAdsButton} onClick={handleSeeAdsClick}>
            <span className={styles.buttonText}>See ads</span>
            <svg
              width="34"
              height="42"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={styles.arrowIcon}
              aria-hidden
            >
              <path
                d="M9 18L15 12L9 6"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

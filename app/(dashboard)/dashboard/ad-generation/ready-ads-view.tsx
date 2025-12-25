'use client';

import Image from 'next/image';
import styles from './ready-ads-view.module.css';

interface ReadyAdsViewProps {
  onSeeAds?: () => void;
}

export function ReadyAdsView({ onSeeAds }: ReadyAdsViewProps) {
  return (
    <div className={styles.container}>
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
          <button className={styles.seeAdsButton} onClick={onSeeAds}>
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
              src="/images/temp/laying_blumpo.png"
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

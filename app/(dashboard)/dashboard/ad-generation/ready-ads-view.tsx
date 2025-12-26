'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from './ready-ads-view.module.css';

interface ReadyAdsViewProps {
  onSeeAds?: () => void;
}

export function ReadyAdsView({ onSeeAds }: ReadyAdsViewProps) {
  const router = useRouter();

  // TEST: Test buttons for different formats - DELETE THESE
  const handleTestFormat = (format: '1:1' | '16:9' | 'mixed') => {
    router.push(`/dashboard/ad-generation/tinder?format=${format}`);
  };

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

          {/* TEST: Test buttons for different formats - DELETE THESE */}
          <div style={{ 
            display: 'flex', 
            gap: '10px', 
            marginTop: '20px',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            <button
              onClick={() => handleTestFormat('1:1')}
              style={{
                padding: '8px 16px',
                backgroundColor: '#ff6b6b',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold',
              }}
            >
              TEST: 1:1 Format
            </button>
            <button
              onClick={() => handleTestFormat('16:9')}
              style={{
                padding: '8px 16px',
                backgroundColor: '#4ecdc4',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold',
              }}
            >
              TEST: 16:9 Format
            </button>
            <button
              onClick={() => handleTestFormat('mixed')}
              style={{
                padding: '8px 16px',
                backgroundColor: '#95e1d3',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold',
              }}
            >
              TEST: Mixed Format
            </button>
          </div>

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

'use client';

import styles from './photo-selection.module.css';

export function PhotoSelectionContent() {
  // Placeholder images - replace with actual product photos
  const currentPhotos = [
    { id: 1, src: "/images/default_ads/ads_1.png" },
    { id: 2, src: "/images/default_ads/ads_2.png" },
    { id: 3, src: "/images/default_ads/ads_3.png" },
    { id: 4, src: "/images/default_ads/ads_4.png" },
  ];

  return (
    <div className={styles.photoSelectionContent}>
      {/* Current Product Photos Section */}
      <div className={`${styles.currentPhotosSection} ${styles.gradientBorder}`}>
        <h2 className={styles.sectionTitle}>Current product photos</h2>
        
        {/* Main photo display */}
        <div className={`${styles.mainPhotoCard} ${styles.gradientBorder}`}>
          <div className={styles.mainPhotoContent}>
            <img 
              src="/images/default_ads/ads_1.png" 
              alt="Main product photo" 
              className={styles.mainPhoto}
            />
          </div>
        </div>

        {/* Photo collage */}
        <div className={styles.photoCollage}>
          {currentPhotos.map((photo, index) => (
            <div 
              key={photo.id}
              className={`${styles.photoCard} ${styles.gradientBorder}`}
            >
              <div className={styles.photoCardInner}>
                <img 
                  src={photo.src} 
                  alt={`Product photo ${index + 1}`}
                  className={styles.photoImage}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Separator */}
      <div className={styles.separator}>
        <span className={styles.separatorText}>or</span>
      </div>

      {/* Add New Photo Section */}
      <button className={`${styles.addNewPhotoSection} ${styles.gradientBorder}`} type="button">
        <h2 className={styles.sectionTitle}>Add new product photo</h2>
        <div className={styles.addIconContainer}>
          <div className={styles.addIconCircle}>
            <svg 
              viewBox="0 0 321 321" 
              fill="none"
              className={styles.addIcon}
            >
              <circle cx="160.5" cy="160.5" r="160.5" fill="url(#addGradient)"/>
              <path 
                d="M160.5 80V241M80 160.5H241" 
                stroke="white" 
                strokeWidth="20" 
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="addGradient" x1="0" y1="0" x2="321" y2="321" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#00BFA6"/>
                  <stop offset="0.5" stopColor="#58C7FF"/>
                  <stop offset="1" stopColor="#0D3B66"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
        <p className={styles.addPhotoHint}>
          We will focus on this picture in the next ads you create.
        </p>
        {/* Character illustration - placeholder */}
        <div className={styles.characterIllustration}>
          {/* Character will be added here */}
        </div>
      </button>
    </div>
  );
}


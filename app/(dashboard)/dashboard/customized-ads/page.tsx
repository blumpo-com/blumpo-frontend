'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

// Image URLs - placeholder for now, will be replaced with actual images
const imgAddIcon = "/assets/icons/Add.svg";
const imgArrowBack = "/assets/icons/ArrowBack.svg";
const imgArrowForward = "/assets/icons/ArrowForward.svg";

interface PageHeaderProps {
  title: string;
  description: string;
}

function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className={styles.pageHeader}>
      <h1 className={styles.pageTitle}>{title}</h1>
      <p className={styles.pageDescription}>{description}</p>
    </div>
  );
}

interface NavigationButtonsProps {
  onBack?: () => void;
  onNext?: () => void;
  backLabel?: string;
  nextLabel?: string;
}

function NavigationButtons({ 
  onBack, 
  onNext, 
  backLabel = "Back", 
  nextLabel = "Next" 
}: NavigationButtonsProps) {
  return (
    <div className={styles.navigationButtons}>
      <button 
        className={styles.backButton}
        onClick={onBack}
        type="button"
      >
        <svg 
          className={styles.arrowIcon} 
          width="11" 
          height="11" 
          viewBox="0 0 11 11" 
          fill="none"
        >
          <path 
            d="M6.5 2.5L4 5L6.5 7.5" 
            stroke="#040404" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
        <span>{backLabel}</span>
      </button>
      <button 
        className={styles.nextButton}
        onClick={onNext}
        type="button"
      >
        <span>{nextLabel}</span>
        <svg 
          className={styles.arrowIcon} 
          width="11" 
          height="11" 
          viewBox="0 0 11 11" 
          fill="none"
        >
          <path 
            d="M4.5 2.5L7 5L4.5 7.5" 
            stroke="#F9FAFB" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}

// Photo Selection Content Component
function PhotoSelectionContent() {
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
      <div className={styles.currentPhotosSection}>
        <h2 className={styles.sectionTitle}>Current product photos</h2>
        
        {/* Main photo display */}
        <div className={styles.mainPhotoCard}>
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
              className={styles.photoCard}
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
      <button className={styles.addNewPhotoSection} type="button">
        <h2 className={styles.sectionTitle}>Add new product photo</h2>
        <div className={styles.addIconContainer}>
          <div className={styles.addIconCircle}>
            <svg 
              width="321" 
              height="321" 
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

export default function CustomizedAdsPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

  // Step configuration - can be extended for multiple steps
  const stepConfig = {
    1: {
      title: "Choose product photos",
      description: "We will include them in your ad.",
      content: <PhotoSelectionContent />
    }
  };

  const currentConfig = stepConfig[currentStep as keyof typeof stepConfig];

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      // Navigate to dashboard home
      router.push('/dashboard');
    }
  };

  const handleNext = () => {
    // TODO: Implement next step logic
    console.log('Next step');
  };

  return (
    <div className={styles.pageContainer}>
      <PageHeader 
        title={currentConfig.title}
        description={currentConfig.description}
      />
      
      <div className={styles.contentArea}>
        {currentConfig.content}
      </div>

      <NavigationButtons 
        onBack={handleBack}
        onNext={handleNext}
      />
    </div>
  );
}


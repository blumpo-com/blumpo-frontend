'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Rocket } from 'lucide-react';
import { useBrand } from '@/lib/contexts/brand-context';
import styles from './page.module.css';

const imgCharacter = "/assets/animations/sitting-blumpo.webp";

const imgImage1 = "/images/dashboard/quick-ad1.png";
const imgImage2 = "/images/dashboard/quick-ad2.png";
const imgImage3 = "/images/dashboard/customized-ad1.png";
const imgImage4 = "/images/dashboard/customized-ad2.png";
const imgImage5 = "/images/default_ads/ads_5.png";
const imgImage6 = "/images/default_ads/ads_6.png";


interface FeatureCardProps {
  title: string;
  description: string;
  gradientClass: string;
  frontImage: string;
  backImage?: string;
  frontImageClass?: string;
  backImageClass?: string;
  onButtonClick?: () => void;
  showCharacter?: boolean;
  characterImage?: string;
  inactive?: boolean;
}

function FeatureCard({
  title,
  description,
  gradientClass,
  frontImage,
  backImage,
  frontImageClass,
  backImageClass,
  onButtonClick,
  showCharacter = false,
  characterImage,
  inactive = false,
}: FeatureCardProps) {
  const cardPositionClass = gradientClass === styles.cardImageGradient1
    ? styles.cardFirst
    : gradientClass === styles.cardImageGradient2
      ? styles.cardSecond
      : styles.cardThird;

  if (showCharacter && characterImage) {
    return (
      <div className={`${styles.cardWrapper} ${cardPositionClass}`}>
        <div className={styles.cardCharacterIllustration}>
          <Image
            src={characterImage}
            alt="Character illustration"
            className={styles.cardCharacterImage}
            width={200}
            height={200}
          />
        </div>
        <div className={`${styles.card} ${styles.cardInWrapper} ${inactive ? `${styles.cardInactive} disabled` : ''}`.trim()}>
          <div className={styles.cardContent}>
            <h3 className={styles.cardTitle}>{title}</h3>
            <p className={styles.cardDescription}>{description}</p>
            <button
              onClick={onButtonClick}
              className={`${styles.cardButton} ${inactive ? 'disabled' : ''}`.trim()}
            >
              {inactive ? 'Coming soon' : 'Create now'}
            </button>
          </div>
          <div className={`${styles.cardImageSection} ${gradientClass} ${gradientClass === styles.cardImageGradient3 ? styles.cardImageSectionThird : ''}`.trim()}>
            <div className={gradientClass === styles.cardImageGradient1 ? styles.imageContainer : styles.imageContainerSecond}>
              {/* Swapped: frontImage now in back position */}
              <div className={styles.imageBack}>
                <div className={styles.imageTransform}>
                  <div className={styles.imageCard}>
                    <Image
                      src={frontImage}
                      alt=""
                      className={`${styles.imageCardBack} ${frontImageClass || ''}`}
                      width={200}
                      height={200}
                    />
                  </div>
                </div>
              </div>
              {/* Swapped: backImage now in front position */}
              {backImage && (
                <div className={`${styles.imageFront}`}>
                  <div className={styles.imageTransform}>
                    <div className={styles.imageCard}>
                      <Image
                        src={backImage}
                        alt=""
                        className={`${styles.imageCardFront} ${backImageClass || ''}`}
                        width={200}
                        height={200}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.card} ${cardPositionClass}`}>
      <div className={styles.cardContent}>
        <h3 className={styles.cardTitle}>{title}</h3>
        <p className={styles.cardDescription}>{description}</p>
        <button
          onClick={onButtonClick}
          className={styles.cardButton}
        >
          Create now
        </button>
      </div>
      <div className={`${styles.cardImageSection} ${gradientClass} ${gradientClass === styles.cardImageGradient3 ? styles.cardImageSectionThird : ''}`.trim()}>
        <div className={gradientClass === styles.cardImageGradient1 ? styles.imageContainer : styles.imageContainerSecond}>
          {/* Swapped: frontImage now in back position */}
          <div className={styles.imageBack}>
            <div className={styles.imageTransform}>
              <div className={styles.imageCard}>
                <Image
                  src={frontImage}
                  alt=""
                  className={`${styles.imageCardBack} ${frontImageClass || ''}`}
                  width={200}
                  height={200}
                />
              </div>
            </div>
          </div>
          {/* Swapped: backImage now in front position */}
          {backImage && (
            <div className={`${styles.imageFront}`}>
              <div className={styles.imageTransform}>
                <div className={styles.imageCard}>
                  <Image
                    src={backImage}
                    alt=""
                    className={`${styles.imageCardFront} ${backImageClass || ''}`}
                    width={200}
                    height={200}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardHomePage() {
  const router = useRouter();
  const { currentBrand } = useBrand();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Example: Access current brand data
  // console.log('Current brand:', currentBrand);

  // Use NEXT_PUBLIC_ prefix for client-side access
  const IS_TEST_MODE = process.env.NEXT_PUBLIC_IS_TEST_MODE === 'true';

  return (
    <div className={styles.homePage}>
      {/* Test button - only show in test mode */}
      {IS_TEST_MODE && (
        <button
          onClick={() => router.push('/dashboard/ad-generation?job_id=ed0166d8-4530-48ef-b0e0-69d183cd0477')}
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            padding: '10px 20px',
            backgroundColor: '#ff6b6b',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          TEST: Ad Generation
        </button>
      )}
      {/* Header Section */}
      <div className={styles.greetingContainer}>
        <h1 className={styles.greeting}>
          <span className={styles.greetingText}>{getGreeting()}, let's create something</span> 🔥
        </h1>
      </div>

      {/* Feature Cards */}
      <div className={styles.cardsContainer}>
        <FeatureCard
          title="Quick Ads Generation"
          description="Only 25 seconds to get the ready ad."
          gradientClass={styles.cardImageGradient1}
          frontImage={imgImage2}
          backImage={imgImage1}
          onButtonClick={() => console.log('Quick Ads clicked')}
        />
        <FeatureCard
          title="Customized Ads Generation"
          description="Content tailored to your needs. Choose between several archetypes."
          gradientClass={styles.cardImageGradient2}
          frontImage={imgImage4}
          backImage={imgImage3}
          onButtonClick={() => router.push('/dashboard/customized-ads')}
        />
        <FeatureCard
          title="Customer & Competitor Insights"
          description="Get to know about your audience and the market itself."
          gradientClass={styles.cardImageGradient3}
          frontImage={imgImage6}
          backImage={imgImage5}
          frontImageClass={styles.imageCardThirdFront}
          backImageClass={styles.imageCardThirdBack}
          onButtonClick={() => console.log('Insights clicked')}
          showCharacter={true}
          characterImage={imgCharacter}
          inactive
        />
      </div>
    </div>
  );
}
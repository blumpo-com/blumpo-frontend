'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Rocket } from 'lucide-react';
import { useBrand } from '@/lib/contexts/brand-context';
import useSWR from 'swr';
import { GameDialog } from '@/components/GameDialog';
import styles from './page.module.css';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Image URLs from Figma - these will expire in 7 days
// const imgImage6 = "https://www.figma.com/api/mcp/asset/25d92da9-a74a-406d-88f7-cd5bcad8e018";
// const imgImage5 = "https://www.figma.com/api/mcp/asset/41a1e504-a3d1-4e92-9d5f-bf72e45ef0de";
// const imgImage7 = "https://www.figma.com/api/mcp/asset/12be56dc-aa2b-497c-a5d7-866daeb52928";
// const imgImage20 = "https://www.figma.com/api/mcp/asset/1684968d-406d-4dbc-838c-722ac4e63ce3";
// const imgImage22 = "https://www.figma.com/api/mcp/asset/1831df1f-4459-4a4e-a85b-72cfb267706c";
// const imgImage21 = "https://www.figma.com/api/mcp/asset/c1cf2b50-3e72-4dc0-a428-011aaafdbe82";
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
                      width={530}
                      height={351}
                      className={`${styles.imageCardBack} ${frontImageClass || ''}`}
                      sizes="362px"
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
                        width={530}
                        height={351}
                        className={`${styles.imageCardFront} ${backImageClass || ''}`}
                        sizes="337px"
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
                  width={530}
                  height={351}
                  className={`${styles.imageCardBack} ${frontImageClass || ''}`}
                  sizes="362px"
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
                    width={530}
                    height={351}
                    className={`${styles.imageCardFront} ${backImageClass || ''}`}
                    sizes="337px"
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
  const { currentBrand, isInitialized } = useBrand();
  const [isCheckingAds, setIsCheckingAds] = useState(false);
  const [isGameOpen, setIsGameOpen] = useState(false);
  // Ref to prevent double execution (React Strict Mode)
  const hasCheckedBrandRef = useRef<string | null>(null);
  const { data: brands = [], isLoading: isLoadingBrands } = useSWR<{ id: string }[]>(
    '/api/brands',
    fetcher,
    { revalidateOnFocus: false }
  );

  // Redirect to input-url when user has no brands
  useEffect(() => {
    if (!isInitialized || isLoadingBrands) return;
    if (Array.isArray(brands) && brands.length === 0) {
      router.replace('/input-url');
    }
  }, [isInitialized, isLoadingBrands, brands, router]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Check and maintain quick ads for paid users
  useEffect(() => {
    const brandId = currentBrand?.id || null;

    // Reset ref if brand changed
    if (brandId && hasCheckedBrandRef.current !== null && hasCheckedBrandRef.current !== brandId) {
      hasCheckedBrandRef.current = null;
    }

    // Don't run if no brand or if we've already checked this brand
    if (!brandId || hasCheckedBrandRef.current === brandId) {
      return;
    }

    // Don't run if already checking
    if (isCheckingAds) {
      return;
    }

    // Mark as checked for this brand to prevent double execution
    hasCheckedBrandRef.current = brandId;

    const checkAndGenerateQuickAds = async () => {
      try {
        setIsCheckingAds(true);

        const checkResponse = await fetch(`/api/quick-ads/check-paid-user?brandId=${brandId}`);

        if (!checkResponse.ok) {
          return;
        }

        const checkData = await checkResponse.json();

        console.log('checkData', checkData);
        if (!checkData.isPaid || !checkData.needsGeneration) {
          return;
        }

        console.log('brandId', brandId);
        // User is paid and needs more ads - trigger generation

        // Generate ads for formats that need them
        const generatePromises = [];

        if (checkData.needsGeneration) {
          // Create quick ads job (generates both formats)
          generatePromises.push(
            fetch('/api/quick-ads/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ brandId }),
            }).then(async (res) => {
              if (res.ok) {
                const data = await res.json();
                // Trigger generation in background
                return fetch('/api/generate/quick-ads', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ jobId: data.job_id }),
                }).catch((err) => {
                  console.error('Background generation error:', err);
                });
              }
            })
          );
        }

        // Fire generation requests (don't wait for completion)
        await Promise.all(generatePromises);
      } catch (error) {
        console.error('Error checking/maintaining quick ads:', error);
      } finally {
        setIsCheckingAds(false);
      }
    };

    checkAndGenerateQuickAds();

    // Only run once when brand changes, not on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBrand?.id]);

  // Use NEXT_PUBLIC_ prefix for client-side access
  const IS_TEST_MODE = process.env.NEXT_PUBLIC_IS_TEST_MODE === 'true';

  // Don't render dashboard content while redirecting (no brands)
  if (isInitialized && !isLoadingBrands && Array.isArray(brands) && brands.length === 0) {
    return null;
  }

  return (
    <div className={styles.homePage}>
      {/* Test buttons - only show in test mode */}
      {IS_TEST_MODE && (
        <>
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
          <button
            onClick={() => setIsGameOpen(true)}
            style={{
              position: 'fixed',
              top: '20px',
              right: '200px',
              zIndex: 9999,
              padding: '10px 20px',
              backgroundColor: '#4ecdc4',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
          >
            TEST: Game
          </button>
        </>
      )}
      {IS_TEST_MODE && <GameDialog open={isGameOpen} onClose={() => setIsGameOpen(false)} />}
      {/* Header Section */}
      <div className={styles.greetingContainer}>
        <h1 className={styles.greeting}>
          <span className={styles.greetingText}>{getGreeting()}, let's create something</span> 🔥
        </h1>
      </div>

      {/* Feature Cards */}
      <div className={styles.cardsContainer}>
        <div className={styles.cardsInner}>
          <FeatureCard
            title="Quick Ads Generation"
            description="Only 25 seconds to get the ready ad."
            gradientClass={styles.cardImageGradient1}
            frontImage={imgImage2}
            backImage={imgImage1}
            onButtonClick={() => router.push('/dashboard/quick-ads-generation')}
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
    </div>
  );
}
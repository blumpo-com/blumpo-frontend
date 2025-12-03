'use client';

import { useState } from 'react';
import { Rocket } from 'lucide-react';
import styles from './page.module.css';

// Image URLs from Figma - these will expire in 7 days
const imgImage6 = "https://www.figma.com/api/mcp/asset/25d92da9-a74a-406d-88f7-cd5bcad8e018";
const imgImage5 = "https://www.figma.com/api/mcp/asset/41a1e504-a3d1-4e92-9d5f-bf72e45ef0de";
const imgImage7 = "https://www.figma.com/api/mcp/asset/12be56dc-aa2b-497c-a5d7-866daeb52928";
const imgImage20 = "https://www.figma.com/api/mcp/asset/1684968d-406d-4dbc-838c-722ac4e63ce3";
const imgImage22 = "https://www.figma.com/api/mcp/asset/1831df1f-4459-4a4e-a85b-72cfb267706c";
const imgImage21 = "https://www.figma.com/api/mcp/asset/c1cf2b50-3e72-4dc0-a428-011aaafdbe82";
const imgCharacter = "https://www.figma.com/api/mcp/asset/14b3e895-0f7a-4d3d-bcfc-f1b5dc7e01f3";

interface FeatureCardProps {
  title: string;
  description: string;
  gradientClass: string;
  frontImage: string;
  backImage?: string;
  frontImageClass?: string;
  backImageClass?: string;
  onButtonClick?: () => void;
}

function FeatureCard({ 
  title, 
  description, 
  gradientClass,
  frontImage,
  backImage,
  frontImageClass,
  backImageClass,
  onButtonClick 
}: FeatureCardProps) {
  const cardPositionClass = gradientClass === styles.cardImageGradient1 
    ? styles.cardFirst 
    : gradientClass === styles.cardImageGradient2 
    ? styles.cardSecond 
    : styles.cardThird;

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
          {backImage && (
            <div className={styles.imageBack}>
              <div className={styles.imageTransform}>
                <div className={styles.imageCard}>
                  <img 
                    src={backImage} 
                    alt="" 
                    className={`${styles.imageCardBack} ${backImageClass || ''}`}
                  />
                </div>
              </div>
            </div>
          )}
          <div className={`${styles.imageFront} ${gradientClass === styles.cardImageGradient1 ? '' : styles.imageFrontSecond}`}>
            <div className={styles.imageTransform}>
              <div className={styles.imageCard}>
                <img 
                  src={frontImage} 
                  alt="" 
                  className={`${styles.imageCardFront} ${frontImageClass || ''}`}
                />
                {gradientClass === styles.cardImageGradient1 && (
                  <div className={styles.imageCardFrontOverlay}>
                    <img src={imgImage5} alt="" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScrollyButton() {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = () => {
    console.log('Scrolly clicked');
  };

  return (
    <button
      onClick={handleClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={(e) => {
        setIsPressed(false);
        e.currentTarget.style.transform = 'scale(1)';
      }}
      style={{
        position: 'fixed',
        bottom: '32px',
        right: '32px',
        zIndex: 50,
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        background: 'linear-gradient(to right, #00bfa6, #00bfa6, #0A5D7A)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: isPressed ? '0 4px 6px rgba(0,0,0,0.1)' : '0 10px 20px rgba(0,0,0,0.2)',
        transition: 'all 0.2s',
        transform: isPressed ? 'scale(0.95)' : 'scale(1)',
        border: 'none',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        if (!isPressed) {
          e.currentTarget.style.transform = 'scale(1.1)';
        }
      }}
      aria-label="Scrolly"
    >
      <Rocket style={{ width: '24px', height: '24px' }} />
    </button>
  );
}

export default function DashboardHomePage() {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className={styles.homePage}>
      {/* Header Section */}
      <div style={{ display: 'flex', gap: '10px', height: '40px', alignItems: 'center', justifyContent: 'center', position: 'relative', width: '100%' }}>
        <h1 className={styles.greeting}>
          {getGreeting()}, let's create something 🔥
        </h1>
        {/* Character illustration */}
        <div className={styles.characterIllustration}>
          <img 
            src={imgCharacter} 
            alt="Character illustration" 
            className={styles.characterImage}
          />
        </div>
      </div>

      {/* Feature Cards */}
      <div className={styles.cardsContainer}>
        <FeatureCard
          title="Quick Ads\nGeneration"
          description="Only 25 seconds to get the ready ad."
          gradientClass={styles.cardImageGradient1}
          frontImage={imgImage6}
          backImage={imgImage7}
          onButtonClick={() => console.log('Quick Ads clicked')}
        />
        <FeatureCard
          title="Customized Ads Generation"
          description="Content tailored to your needs. Choose between several archetypes."
          gradientClass={styles.cardImageGradient2}
          frontImage={imgImage6}
          backImage={imgImage20}
          onButtonClick={() => console.log('Customized Ads clicked')}
        />
        <FeatureCard
          title="Customer & Competitor Insights"
          description="Get to know about your audience and the market itself."
          gradientClass={styles.cardImageGradient3}
          frontImage={imgImage22}
          backImage={imgImage21}
          frontImageClass={styles.imageCardThirdFront}
          backImageClass={styles.imageCardThirdBack}
          onButtonClick={() => console.log('Insights clicked')}
        />
      </div>

      {/* Scrolly Button */}
      <ScrollyButton />
    </div>
  );
}
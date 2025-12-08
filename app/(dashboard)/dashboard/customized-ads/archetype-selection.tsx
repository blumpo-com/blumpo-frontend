'use client';

import { useState } from 'react';
import styles from './archetype-selection.module.css';

interface ArchetypeCardProps {
  id: string;
  title: string;
  description: string;
  previewImages: string[];
  isSelected: boolean;
  onClick: () => void;
}

function ArchetypeCard({ 
  id, 
  title, 
  description, 
  previewImages, 
  isSelected, 
  onClick 
}: ArchetypeCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const shouldShowTwoImages = isSelected || isHovered;
  const imagesToShow = shouldShowTwoImages ? previewImages.slice(0, 2) : previewImages.slice(0, 1);

  return (
    <button
      className={`${styles.archetypeCard} ${isSelected ? styles.archetypeCardSelected : styles.gradientBorder}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      type="button"
    >
      <div className={styles.cardContent}>
        <h3 className={styles.cardTitle}>{title}</h3>
        <p className={styles.cardDescription}>{description}</p>
      </div>
      
      <div className={styles.previewContainer}>
        {imagesToShow.map((imageSrc, index) => (
          <div 
            key={index}
            className={`${styles.previewImageWrapper} ${
              shouldShowTwoImages 
                ? index === 0 
                  ? styles.firstImageAnimate 
                  : styles.secondImageAnimate
                : index === 0 
                  ? styles.singleImageState 
                  : ''
            }`}
            style={{ 
              zIndex: imagesToShow.length - index,
            }}
          >
            <div className={styles.previewImageCard}>
              <img 
                src={imageSrc} 
                alt={`${title} preview ${index + 1}`}
                className={styles.previewImage}
              />
            </div>
          </div>
        ))}
      </div>
    </button>
  );
}

interface ArchetypeSelectionContentProps {
  selectedArchetype: string;
  onSelectedArchetypeChange: (archetype: string) => void;
}

export function ArchetypeSelectionContent({
  selectedArchetype,
  onSelectedArchetypeChange,
}: ArchetypeSelectionContentProps) {
  const archetypes = [
    {
      id: 'problem-solution',
      title: 'Problem-Solution',
      description: "Show user's pain point and how your product resolves it",
      previewImages: [
        '/images/default_ads/ads_1.png',
        '/images/default_ads/ads_2.png'
      ]
    },
    {
      id: 'testimonial',
      title: 'Testimonial',
      description: 'Build the ad around a customer review/quote',
      previewImages: [
        '/images/default_ads/ads_3.png',
        '/images/default_ads/ads_2.png'
      ]
    },
    {
      id: 'competitor-comparison',
      title: 'Competitor Comparison',
      description: 'Visually present how the product works and delivers value',
      previewImages: [
        '/images/default_ads/ads_4.png',
        '/images/default_ads/ads_2.png'
      ]
    },
    {
      id: 'promotion-offer',
      title: 'Promotion (Offer)',
      description: 'Communicate a clear, time-limited deal to prompt immediate action',
      previewImages: [
        '/images/default_ads/ads_5.png',
        '/images/default_ads/ads_2.png'
      ]
    },
    {
      id: 'value-proposition',
      title: 'Value Proposition',
      description: 'Highlight the core benefit and what sets the product apart',
      previewImages: [
        '/images/default_ads/ads_6.png',
        '/images/default_ads/ads_2.png'
      ]
    },
    {
      id: 'random',
      title: 'Random',
      description: 'Use 2 random archetypes to generate ads',
      previewImages: [
        '/images/default_ads/ads_1.png',
        '/images/default_ads/ads_2.png'
      ]
    }
  ];

  return (
    <div className={styles.archetypeSelectionContent}>
      {archetypes.map((archetype) => (
        <ArchetypeCard
          key={archetype.id}
          id={archetype.id}
          title={archetype.title}
          description={archetype.description}
          previewImages={archetype.previewImages}
          isSelected={selectedArchetype === archetype.id}
          onClick={() => onSelectedArchetypeChange(archetype.id)}
        />
      ))}
    </div>
  );
}


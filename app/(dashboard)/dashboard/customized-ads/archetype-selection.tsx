'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
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
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const prevShouldShowTwoImagesRef = useRef(false);
  const shouldShowTwoImages = isSelected || isHovered;
  const showTwoImagesForAnimation = shouldShowTwoImages || isAnimatingOut;

  useEffect(() => {
    if (prevShouldShowTwoImagesRef.current && !shouldShowTwoImages) {
      setIsAnimatingOut(true);
      const timer = setTimeout(() => setIsAnimatingOut(false), 300);
      return () => clearTimeout(timer);
    } else if (!prevShouldShowTwoImagesRef.current && shouldShowTwoImages) {
      setIsAnimatingOut(false);
    }
    prevShouldShowTwoImagesRef.current = shouldShowTwoImages;
  }, [shouldShowTwoImages]);

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
        {showTwoImagesForAnimation && previewImages.length > 1 ? (
          <>
            <div
              className={`${styles.previewImageWrapper} ${isAnimatingOut ? styles.firstImageReverse : styles.firstImageAnimate
                }`}
              style={{ zIndex: 2 }}
            >
              <div className={styles.previewImageCard}>
                <Image
                  src={previewImages[0]}
                  alt={`${title} preview 1`}
                  className={styles.previewImage}
                  width={200}
                  height={200}
                  unoptimized
                />
              </div>
            </div>
            <div
              className={`${styles.previewImageWrapper} ${isAnimatingOut ? styles.secondImageReverse : styles.secondImageAnimate
                }`}
              style={{ zIndex: 1 }}
            >
              <div className={styles.previewImageCard}>
                <Image
                  src={previewImages[1]}
                  alt={`${title} preview 2`}
                  className={styles.previewImage}
                  width={200}
                  height={200}
                  unoptimized
                />
              </div>
            </div>
          </>
        ) : (
          <div
            className={`${styles.previewImageWrapper} ${styles.singleImageState}`}
            style={{ zIndex: 1 }}
          >
            <div className={styles.previewImageCard}>
              <Image
                src={previewImages[0]}
                alt={`${title} preview 1`}
                className={styles.previewImage}
                width={200}
                height={200}
                unoptimized
              />
            </div>
          </div>
        )}
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
      id: 'problem_solution',
      title: 'Problem-Solution',
      description: "Show user's pain point and how your product resolves it",
      previewImages: [
        '/images/dashboard/archetypes/problem-solution/1.png',
        '/images/dashboard/archetypes/problem-solution/2.png'
      ]
    },
    {
      id: 'testimonial',
      title: 'Testimonial',
      description: 'Build the ad around a customer review/quote',
      previewImages: [
        '/images/dashboard/archetypes/testimonial/1.png',
        '/images/dashboard/archetypes/testimonial/2.png'
      ]
    },
    {
      id: 'competitor_comparison',
      title: 'Competitor Comparison',
      description: 'Visually present how the product works and delivers value',
      previewImages: [
        '/images/dashboard/archetypes/competitor-comparison/1.png',
        '/images/dashboard/archetypes/competitor-comparison/2.png'
      ]
    },
    {
      id: 'meme',
      title: 'Meme',
      description: 'Use memes to make the ad more engaging',
      previewImages: [
        '/images/dashboard/archetypes/meme/1.png',
        '/images/dashboard/archetypes/meme/2.png'
      ]
    },
    {
      id: 'value_proposition',
      title: 'Value Proposition',
      description: 'Highlight the core benefit and what sets the product apart',
      previewImages: [
        '/images/dashboard/archetypes/value-prop/1.png',
        '/images/dashboard/archetypes/value-prop/2.png'
      ]
    },
    {
      id: 'random',
      title: 'Random',
      description: 'Use 2 random archetypes to generate ads',
      previewImages: [
        '/images/dashboard/archetypes/random/1.png',
        '/images/dashboard/archetypes/random/2.png'
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


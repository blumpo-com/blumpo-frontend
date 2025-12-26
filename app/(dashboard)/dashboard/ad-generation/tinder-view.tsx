'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import styles from './tinder-view.module.css';

export type AdFormat = '1:1' | '16:9' | 'mixed';

interface Ad {
  id: string;
  imageUrl: string;
  format: '1:1' | '16:9';
}

interface TinderViewProps {
  ads: Ad[];
  format: AdFormat;
  onAddToLibrary?: (adId: string) => void;
  onDelete?: (adId: string) => void;
}

export function TinderView({ ads, format, onAddToLibrary, onDelete }: TinderViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const startYRef = useRef<number>(0);

  // Filter ads based on format
  const filteredAds = ads.filter(ad => {
    if (format === 'mixed') return true;
    return ad.format === format;
  });

  const currentAd = filteredAds[currentIndex];
  const nextAd = filteredAds[currentIndex + 1];
  const prevAd = filteredAds[currentIndex - 1];

  // Get card size based on format
  const getCardSize = (adFormat: '1:1' | '16:9') => {
    if (adFormat === '1:1') {
      return { width: 374, height: 374 };
    } else {
      return { width: 252, height: 448 };
    }
  };

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    if (isAnimating || !currentAd) return;
    
    setIsAnimating(true);
    setSwipeDirection(direction);
    setSwipeOffset(direction === 'left' ? -1000 : 1000);

    setTimeout(() => {
      if (direction === 'right') {
        onAddToLibrary?.(currentAd.id);
      } else {
        onDelete?.(currentAd.id);
      }
      
      setCurrentIndex(prev => prev + 1);
      setSwipeOffset(0);
      setSwipeDirection(null);
      setIsAnimating(false);
    }, 300);
  }, [currentAd, isAnimating, onAddToLibrary, onDelete]);

  const handleUndo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isAnimating) return;
    const touch = e.touches[0];
    startXRef.current = touch.clientX;
    startYRef.current = touch.clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || isAnimating) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - startXRef.current;
    const deltaY = touch.clientY - startYRef.current;

    // Only process horizontal swipes
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      setSwipeOffset(deltaX);
      setSwipeDirection(deltaX > 0 ? 'right' : 'left');
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging || isAnimating) return;
    
    const threshold = 100;
    if (Math.abs(swipeOffset) > threshold) {
      handleSwipe(swipeOffset > 0 ? 'right' : 'left');
    } else {
      setSwipeOffset(0);
      setSwipeDirection(null);
    }
    
    setIsDragging(false);
  };

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isAnimating) return;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    setIsDragging(true);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || isAnimating) return;
    const deltaX = e.clientX - startXRef.current;
    const deltaY = e.clientY - startYRef.current;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      setSwipeOffset(deltaX);
      setSwipeDirection(deltaX > 0 ? 'right' : 'left');
    }
  }, [isDragging, isAnimating]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging || isAnimating) return;
    
    const threshold = 100;
    if (Math.abs(swipeOffset) > threshold) {
      handleSwipe(swipeOffset > 0 ? 'right' : 'left');
    } else {
      setSwipeOffset(0);
      setSwipeDirection(null);
    }
    
    setIsDragging(false);
  }, [isDragging, isAnimating, swipeOffset, handleSwipe]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!currentAd) {
    return (
      <div className={styles.emptyState}>
        <h2>No more ads to review</h2>
        <p>All ads have been reviewed!</p>
      </div>
    );
  }

  const rotation = swipeOffset * 0.1;
  const opacity = 1 - Math.abs(swipeOffset) / 500;

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>
            <span className={styles.titleText}>Pick your favourite ads.</span>
          </h1>
          <div className={styles.subtitle}>
            <p>Swipe right to add your ad to library.</p>
            <p>Swipe left to delete it.</p>
          </div>
        </div>

        {/* Tinder Cards Area */}
        <div className={styles.cardsContainer}>
          <div className={styles.cardsStack}>
            {/* Previous card (behind) */}
            {prevAd && (() => {
              const size = getCardSize(prevAd.format);
              return (
                <div 
                  key={`prev-${prevAd.id}`}
                  className={`${styles.card} ${styles.cardPrevious}`}
                  data-format={prevAd.format}
                  style={{ width: size.width, height: size.height }}
                >
                  <div className={styles.cardImageWrapper}>
                    <Image
                      src={prevAd.imageUrl}
                      alt="Previous ad"
                      fill
                      className={styles.cardImage}
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                </div>
              );
            })()}

            {/* Next card (behind) */}
            {nextAd && (() => {
              const size = getCardSize(nextAd.format);
              return (
                <div 
                  key={`next-${nextAd.id}`}
                  className={`${styles.card} ${styles.cardNext}`}
                  data-format={nextAd.format}
                  style={{ width: size.width, height: size.height }}
                >
                  <div className={styles.cardImageWrapper}>
                    <Image
                      src={nextAd.imageUrl}
                      alt="Next ad"
                      fill
                      className={styles.cardImage}
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                </div>
              );
            })()}

            {/* Current card */}
            {(() => {
              const size = getCardSize(currentAd.format);
              return (
                <div
                  key={`current-${currentAd.id}`}
                  ref={cardRef}
                  className={`${styles.card} ${styles.cardCurrent} ${swipeDirection === 'left' ? styles.cardSwipeLeft : ''} ${swipeDirection === 'right' ? styles.cardSwipeRight : ''}`}
                  data-format={currentAd.format}
                  style={{
                    width: size.width,
                    height: size.height,
                    transform: `translateX(${swipeOffset}px) rotate(${rotation}deg)`,
                    opacity: opacity < 0 ? 0 : opacity,
                    transition: isDragging || swipeOffset !== 0 ? 'transform 0.1s linear, opacity 0.1s linear' : 'none',
                  }}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onMouseDown={handleMouseDown}
                >
                  <div className={styles.cardImageWrapper}>
                    <Image
                      src={currentAd.imageUrl}
                      alt="Current ad"
                      fill
                      className={styles.cardImage}
                      style={{ objectFit: 'cover' }}
                      priority
                    />
                    {/* Overlay for swipe feedback */}
                    {swipeDirection === 'left' && (
                      <div className={styles.deleteOverlay}>
                        <span className={styles.deleteText}>DELETE</span>
                      </div>
                    )}
                    {swipeDirection === 'right' && (
                      <div className={styles.addOverlay}>
                        <span className={styles.addText}>ADD TO LIBRARY</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Action Buttons */}
          <div className={styles.actionButtons}>
            <button
              className={styles.deleteButton}
              onClick={() => handleSwipe('left')}
              disabled={isAnimating}
              aria-label="Delete ad"
            >
              <svg width="86" height="86" viewBox="0 0 86 86" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="43" cy="43" r="38" fill="white" stroke="#D42626" strokeWidth="2"/>
                <path d="M30 43L56 43" stroke="#D42626" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </button>
            
            <button
              className={styles.undoButton}
              onClick={handleUndo}
              disabled={currentIndex === 0 || isAnimating}
              aria-label="Undo"
            >
              <svg width="71" height="71" viewBox="0 0 71 71" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="35.5" cy="35.5" r="32" fill="white"/>
                <path d="M30 35.5L25 30.5L30 25.5" stroke="#0A0A0A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M25 30.5H40C45 30.5 49 34.5 49 39.5" stroke="#0A0A0A" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>

            <button
              className={styles.addButton}
              onClick={() => handleSwipe('right')}
              disabled={isAnimating}
              aria-label="Add to library"
            >
              <svg width="86" height="86" viewBox="0 0 86 86" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="43" cy="43" r="38" fill="white" stroke="#00BFA6" strokeWidth="0.84"/>
                <path d="M33 43L43 33L53 43M43 33V53" stroke="#00BFA6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


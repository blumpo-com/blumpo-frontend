'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import styles from './tinder-view.module.css';

export type AdFormat = '1:1' | '9:16' | 'mixed';

interface Ad {
  id: string;
  imageUrl: string;
  format: '1:1' | '9:16';
}

interface TinderViewProps {
  ads: Ad[];
  format: AdFormat;
  onAddToLibrary?: (adId: string) => void;
  onDelete?: (adId: string) => void;
  onSave?: (adId: string, imageUrl: string) => void;
  onComplete?: () => void;
}

export function TinderView({ ads, format, onAddToLibrary, onDelete, onSave, onComplete }: TinderViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [leftCardAnimating, setLeftCardAnimating] = useState(false);
  const [rightCardAnimating, setRightCardAnimating] = useState(false);
  const [nextCardSide, setNextCardSide] = useState<'left' | 'right'>('left'); // Alternates between left and right
  const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({});
  const hasCompletedRef = useRef(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const startYRef = useRef<number>(0);

  const handleImageLoadStart = (adId: string) => {
    setImageLoading(prev => ({ ...prev, [adId]: true }));
  };

  const handleImageLoad = (adId: string) => {
    setImageLoading(prev => ({ ...prev, [adId]: false }));
  };

  // Filter ads based on format
  const filteredAds = ads.filter(ad => {
    if (format === 'mixed') return true;
    return ad.format === format;
  });

  const currentAd = filteredAds[currentIndex];
  const nextAd = filteredAds[currentIndex + 1];
  const nextNextAd = filteredAds[currentIndex + 2];
  const isLastAd = !nextAd;

  // Determine which card goes on which side based on turn
  const leftAd = nextCardSide === 'left' ? nextAd : nextNextAd;
  const rightAd = nextCardSide === 'left' ? nextNextAd : nextAd;

  // Get card size based on format
  const getCardSize = (adFormat: '1:1' | '9:16') => {
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

    // Animate the card on the active side to center (alternates)
    if (nextCardSide === 'left' && leftAd) {
      setLeftCardAnimating(true);
    } else if (nextCardSide === 'right' && rightAd) {
      setRightCardAnimating(true);
    }

    setTimeout(() => {
      if (direction === 'right') {
        onAddToLibrary?.(currentAd.id);
      } else {
        onDelete?.(currentAd.id);
      }

      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setSwipeOffset(0);
      setSwipeDirection(null);
      setLeftCardAnimating(false);
      setRightCardAnimating(false);
      // Alternate the side for next turn
      setNextCardSide(prev => prev === 'left' ? 'right' : 'left');
      setIsAnimating(false);
    }, 300);
  }, [currentAd, isAnimating, onAddToLibrary, onDelete, leftAd, rightAd, nextCardSide, currentIndex, filteredAds.length]);

  const handleUndo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      // Reverse the side alternation when undoing
      setNextCardSide(prev => prev === 'left' ? 'right' : 'left');
    }
  }, [currentIndex]);

  const handleSave = useCallback(() => {
    if (currentAd && onSave) {
      onSave(currentAd.id, currentAd.imageUrl);
    }
  }, [currentAd, onSave]);

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

  // Check if all ads are reviewed and trigger onComplete
  useEffect(() => {
    if (!currentAd && filteredAds.length > 0 && onComplete && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      onComplete();
    }
  }, [currentAd, filteredAds.length, onComplete]);

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
            {/* Right card (behind on the right) - animates to center on alternating turns */}
            {rightAd && (() => {
              const size = getCardSize(rightAd.format);
              return (
                <div
                  key={`right-${rightAd.id}`}
                  className={`${styles.card} ${styles.cardRight} ${rightCardAnimating ? styles.cardRightAnimating : ''}`}
                  data-format={rightAd.format}
                  style={{ width: size.width, height: size.height }}
                >
                  <div className={styles.cardImageWrapper}>
                    {imageLoading[`right-${rightAd.id}`] && (
                      <div className={styles.imageSkeleton} />
                    )}
                    <Image
                      src={rightAd.imageUrl}
                      alt="Right ad"
                      fill
                      quality={80}
                      sizes={rightAd.format === '1:1' ? '(max-width: 768px) 280px, 374px' : '(max-width: 768px) 188px, 252px'}
                      className={styles.cardImage}
                      style={{ objectFit: 'cover', opacity: imageLoading[`right-${rightAd.id}`] ? 0 : 1 }}
                      onLoadStart={() => handleImageLoadStart(`right-${rightAd.id}`)}
                      onLoad={() => handleImageLoad(`right-${rightAd.id}`)}
                    />
                  </div>
                </div>
              );
            })()}

            {/* Left card (behind on the left) - animates to center on alternating turns */}
            {leftAd && (() => {
              const size = getCardSize(leftAd.format);
              return (
                <div
                  key={`left-${leftAd.id}`}
                  className={`${styles.card} ${styles.cardLeft} ${leftCardAnimating ? styles.cardLeftAnimating : ''}`}
                  data-format={leftAd.format}
                  style={{ width: size.width, height: size.height }}
                >
                  <div className={styles.cardImageWrapper}>
                    {imageLoading[`left-${leftAd.id}`] && (
                      <div className={styles.imageSkeleton} />
                    )}
                    <Image
                      src={leftAd.imageUrl}
                      alt="Left ad"
                      fill
                      quality={80}
                      sizes={leftAd.format === '1:1' ? '(max-width: 768px) 280px, 374px' : '(max-width: 768px) 188px, 252px'}
                      className={styles.cardImage}
                      style={{ objectFit: 'cover', opacity: imageLoading[`left-${leftAd.id}`] ? 0 : 1 }}
                      onLoadStart={() => handleImageLoadStart(`left-${leftAd.id}`)}
                      onLoad={() => handleImageLoad(`left-${leftAd.id}`)}
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
                    transform: `translate(-50%, -50%) translateX(${swipeOffset}px) rotate(${rotation}deg)`,
                    opacity: opacity < 0 ? 0 : opacity,
                    transition: isDragging || swipeOffset !== 0 ? 'transform 0.3s linear, opacity 0.3s linear' : 'none',
                    left: '50%',
                    top: '50%',
                  }}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onMouseDown={handleMouseDown}
                >
                  <div className={styles.cardImageWrapper}>
                    {imageLoading[`current-${currentAd.id}`] && (
                      <div className={styles.imageSkeleton} />
                    )}
                    <Image
                      src={currentAd.imageUrl}
                      alt="Current ad"
                      fill
                      quality={80}
                      sizes={currentAd.format === '1:1' ? '(max-width: 768px) 280px, 374px' : '(max-width: 768px) 188px, 252px'}
                      className={styles.cardImage}
                      style={{ objectFit: 'cover', opacity: imageLoading[`current-${currentAd.id}`] ? 0 : 1 }}
                      priority
                      onLoadStart={() => handleImageLoadStart(`current-${currentAd.id}`)}
                      onLoad={() => handleImageLoad(`current-${currentAd.id}`)}
                    />
                    {/* Overlay for swipe feedback */}
                    {swipeDirection === 'left' && (
                      <div className={styles.deleteOverlay}>
                        <span className={styles.deleteText}>Delete</span>
                      </div>
                    )}
                    {swipeDirection === 'right' && (
                      <div className={styles.addOverlay}>
                        <span className={styles.addText}>Add to library</span>
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
              <div className={styles.deleteButtonIcon}>
                <Image
                  src="/assets/icons/delete.svg"
                  alt="Delete"
                  width={36}
                  height={36}
                />
              </div>
            </button>

            <button
              className={styles.saveButton}
              onClick={handleSave}
              disabled={isAnimating}
              aria-label="Save ad"
            >
              <div className={styles.saveButtonIcon}>
                <Image
                  src="/assets/icons/save.svg"
                  alt="Save"
                  width={29}
                  height={35}
                />
              </div>
            </button>

            <button
              className={styles.addButton}
              onClick={() => handleSwipe('right')}
              disabled={isAnimating}
              aria-label="Add to library"
            >
              <div className={styles.addButtonIcon}>
                <Image
                  src="/assets/icons/heart.svg"
                  alt="Add to library"
                  width={36}
                  height={34}
                />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


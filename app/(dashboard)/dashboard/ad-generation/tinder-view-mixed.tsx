'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import styles from './tinder-view-mixed.module.css';

interface Ad {
  id: string;
  imageUrl: string;
  format: '1:1' | '16:9';
}

interface TinderViewMixedProps {
  ads1_1: Ad[];
  ads16_9: Ad[];
  onAddToLibrary?: (adId: string) => void;
  onDelete?: (adId: string) => void;
  onSave?: (adId: string, imageUrl: string) => void;
}

export function TinderViewMixed({ ads1_1, ads16_9, onAddToLibrary, onDelete, onSave }: TinderViewMixedProps) {
  // State for 1:1 stack
  const [currentIndex1_1, setCurrentIndex1_1] = useState(0);
  const [swipeOffset1_1, setSwipeOffset1_1] = useState(0);
  const [isDragging1_1, setIsDragging1_1] = useState(false);
  const [swipeDirection1_1, setSwipeDirection1_1] = useState<'left' | 'right' | null>(null);
  const [isAnimating1_1, setIsAnimating1_1] = useState(false);
  const [leftCardAnimating1_1, setLeftCardAnimating1_1] = useState(false);
  const [rightCardAnimating1_1, setRightCardAnimating1_1] = useState(false);
  const [nextCardSide1_1, setNextCardSide1_1] = useState<'left' | 'right'>('left');

  // State for 16:9 stack
  const [currentIndex16_9, setCurrentIndex16_9] = useState(0);
  const [swipeOffset16_9, setSwipeOffset16_9] = useState(0);
  const [isDragging16_9, setIsDragging16_9] = useState(false);
  const [swipeDirection16_9, setSwipeDirection16_9] = useState<'left' | 'right' | null>(null);
  const [isAnimating16_9, setIsAnimating16_9] = useState(false);
  const [leftCardAnimating16_9, setLeftCardAnimating16_9] = useState(false);
  const [rightCardAnimating16_9, setRightCardAnimating16_9] = useState(false);
  const [nextCardSide16_9, setNextCardSide16_9] = useState<'left' | 'right'>('left');

  const cardRef1_1 = useRef<HTMLDivElement>(null);
  const cardRef16_9 = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const startYRef = useRef<number>(0);
  const isDraggingRef = useRef<'1:1' | '16:9' | null>(null);

  // Get current ads
  const currentAd1_1 = ads1_1[currentIndex1_1];
  const nextAd1_1 = ads1_1[currentIndex1_1 + 1];
  const nextNextAd1_1 = ads1_1[currentIndex1_1 + 2];
  const leftAd1_1 = nextCardSide1_1 === 'left' ? nextAd1_1 : nextNextAd1_1;
  const rightAd1_1 = nextCardSide1_1 === 'left' ? nextNextAd1_1 : nextAd1_1;

  const currentAd16_9 = ads16_9[currentIndex16_9];
  const nextAd16_9 = ads16_9[currentIndex16_9 + 1];
  const nextNextAd16_9 = ads16_9[currentIndex16_9 + 2];
  const leftAd16_9 = nextCardSide16_9 === 'left' ? nextAd16_9 : nextNextAd16_9;
  const rightAd16_9 = nextCardSide16_9 === 'left' ? nextNextAd16_9 : nextAd16_9;

  // Sync swipe offset between both stacks
  const syncSwipeOffset = useCallback((offset: number, direction: 'left' | 'right' | null) => {
    setSwipeOffset1_1(offset);
    setSwipeOffset16_9(offset);
    setSwipeDirection1_1(direction);
    setSwipeDirection16_9(direction);
  }, []);

  const handleSwipe = useCallback((direction: 'left' | 'right', stack: '1:1' | '16:9') => {
    const isAnimating = stack === '1:1' ? isAnimating1_1 : isAnimating16_9;
    const currentAd = stack === '1:1' ? currentAd1_1 : currentAd16_9;
    const leftAd = stack === '1:1' ? leftAd1_1 : leftAd16_9;
    const rightAd = stack === '1:1' ? rightAd1_1 : rightAd16_9;
    const nextCardSide = stack === '1:1' ? nextCardSide1_1 : nextCardSide16_9;

    if (isAnimating || !currentAd) return;

    // Set animating for both stacks
    setIsAnimating1_1(true);
    setIsAnimating16_9(true);
    
    syncSwipeOffset(direction === 'left' ? -1000 : 1000, direction);

    // Animate the card on the active side to center (alternates)

      if (nextCardSide === 'left' && leftAd) {
        setLeftCardAnimating1_1(true);
        setLeftCardAnimating16_9(true);
      } else if (nextCardSide === 'right' && rightAd) {
        setRightCardAnimating1_1(true);
        setRightCardAnimating16_9(true);
      }

    setTimeout(() => {
      if (direction === 'right') {
        onAddToLibrary?.(currentAd.id);
      } else {
        onDelete?.(currentAd.id);
      }

      // Update the swiped stack
      if (stack === '1:1') {
        setCurrentIndex1_1(prev => prev + 1);
        setSwipeOffset1_1(0);
        setSwipeDirection1_1(null);
        setLeftCardAnimating1_1(false);
        setRightCardAnimating1_1(false);
        setNextCardSide1_1(prev => prev === 'left' ? 'right' : 'left');
      } else {
        setCurrentIndex16_9(prev => prev + 1);
        setSwipeOffset16_9(0);
        setSwipeDirection16_9(null);
        setLeftCardAnimating16_9(false);
        setRightCardAnimating16_9(false);
        setNextCardSide16_9(prev => prev === 'left' ? 'right' : 'left');
      }

      // Sync the other stack - find and update the matching ad by ID
      const otherStack = stack === '1:1' ? '16:9' : '1:1';
      const otherAds = otherStack === '1:1' ? ads1_1 : ads16_9;
      const otherCurrentIndex = otherStack === '1:1' ? currentIndex1_1 : currentIndex16_9;
      const otherCurrentAd = otherAds[otherCurrentIndex];
      
      // If the other stack has the same ID, advance it too
      if (otherCurrentAd?.id === currentAd.id) {
        if (otherStack === '1:1') {
          setCurrentIndex1_1(prev => prev + 1);
          setSwipeOffset1_1(0);
          setSwipeDirection1_1(null);
          setLeftCardAnimating1_1(false);
          setRightCardAnimating1_1(false);
          setNextCardSide1_1(prev => prev === 'left' ? 'right' : 'left');
        } else {
          setCurrentIndex16_9(prev => prev + 1);
          setSwipeOffset16_9(0);
          setSwipeDirection16_9(null);
          setLeftCardAnimating16_9(false);
          setRightCardAnimating16_9(false);
          setNextCardSide16_9(prev => prev === 'left' ? 'right' : 'left');
        }
      } else {
        // Reset swipe offset for the other stack even if IDs don't match
        if (otherStack === '1:1') {
          setSwipeOffset1_1(0);
          setSwipeDirection1_1(null);
        } else {
          setSwipeOffset16_9(0);
          setSwipeDirection16_9(null);
        }
      }

      syncSwipeOffset(0, null);
      setIsAnimating1_1(false);
      setIsAnimating16_9(false);
    }, 300);
  }, [currentAd1_1, currentAd16_9, isAnimating1_1, isAnimating16_9, onAddToLibrary, onDelete, leftAd1_1, rightAd1_1, leftAd16_9, rightAd16_9, nextCardSide1_1, nextCardSide16_9, currentIndex1_1, currentIndex16_9, ads1_1, ads16_9, syncSwipeOffset]);

  const handleUndo = useCallback(() => {
    if (currentIndex1_1 > 0 && currentIndex16_9 > 0) {
      setCurrentIndex1_1(prev => prev - 1);
      setCurrentIndex16_9(prev => prev - 1);
      setNextCardSide1_1(prev => prev === 'left' ? 'right' : 'left');
      setNextCardSide16_9(prev => prev === 'left' ? 'right' : 'left');
    }
  }, [currentIndex1_1, currentIndex16_9]);

  const handleSave = useCallback(() => {
    if (currentAd1_1 && onSave) {
      onSave(currentAd1_1.id, currentAd1_1.imageUrl);
    }
    if (currentAd16_9 && onSave) {
      onSave(currentAd16_9.id, currentAd16_9.imageUrl);
    }
  }, [currentAd1_1, currentAd16_9, onSave]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent, stack: '1:1' | '16:9') => {
    if ((stack === '1:1' ? isAnimating1_1 : isAnimating16_9)) return;
    const touch = e.touches[0];
    startXRef.current = touch.clientX;
    startYRef.current = touch.clientY;
    isDraggingRef.current = stack;
    if (stack === '1:1') {
      setIsDragging1_1(true);
    } else {
      setIsDragging16_9(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const draggingStack = isDraggingRef.current;
    if (!draggingStack) return;
    
    const isAnimating = draggingStack === '1:1' ? isAnimating1_1 : isAnimating16_9;
    const isDragging = draggingStack === '1:1' ? isDragging1_1 : isDragging16_9;
    
    if (!isDragging || isAnimating) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - startXRef.current;
    const deltaY = touch.clientY - startYRef.current;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      syncSwipeOffset(deltaX, deltaX > 0 ? 'right' : 'left');
    }
  };

  const handleTouchEnd = () => {
    const draggingStack = isDraggingRef.current;
    if (!draggingStack) return;
    
    const isDragging = draggingStack === '1:1' ? isDragging1_1 : isDragging16_9;
    const isAnimating = draggingStack === '1:1' ? isAnimating1_1 : isAnimating16_9;
    
    if (!isDragging || isAnimating) return;

    const threshold = 100;
    const swipeOffset = draggingStack === '1:1' ? swipeOffset1_1 : swipeOffset16_9;
    
    if (Math.abs(swipeOffset) > threshold) {
      handleSwipe(swipeOffset > 0 ? 'right' : 'left', draggingStack);
    } else {
      syncSwipeOffset(0, null);
    }

    if (draggingStack === '1:1') {
      setIsDragging1_1(false);
    } else {
      setIsDragging16_9(false);
    }
    isDraggingRef.current = null;
  };

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent, stack: '1:1' | '16:9') => {
    if ((stack === '1:1' ? isAnimating1_1 : isAnimating16_9)) return;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    isDraggingRef.current = stack;
    if (stack === '1:1') {
      setIsDragging1_1(true);
    } else {
      setIsDragging16_9(true);
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const draggingStack = isDraggingRef.current;
    if (!draggingStack) return;
    
    const isAnimating = draggingStack === '1:1' ? isAnimating1_1 : isAnimating16_9;
    const isDragging = draggingStack === '1:1' ? isDragging1_1 : isDragging16_9;
    
    if (!isDragging || isAnimating) return;
    
    const deltaX = e.clientX - startXRef.current;
    const deltaY = e.clientY - startYRef.current;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      syncSwipeOffset(deltaX, deltaX > 0 ? 'right' : 'left');
    }
  }, [isDragging1_1, isDragging16_9, isAnimating1_1, isAnimating16_9, syncSwipeOffset]);

  const handleMouseUp = useCallback(() => {
    const draggingStack = isDraggingRef.current;
    if (!draggingStack) return;
    
    const isDragging = draggingStack === '1:1' ? isDragging1_1 : isDragging16_9;
    const isAnimating = draggingStack === '1:1' ? isAnimating1_1 : isAnimating16_9;
    
    if (!isDragging || isAnimating) return;

    const threshold = 100;
    const swipeOffset = draggingStack === '1:1' ? swipeOffset1_1 : swipeOffset16_9;
    
    if (Math.abs(swipeOffset) > threshold) {
      handleSwipe(swipeOffset > 0 ? 'right' : 'left', draggingStack);
    } else {
      syncSwipeOffset(0, null);
    }

    if (draggingStack === '1:1') {
      setIsDragging1_1(false);
    } else {
      setIsDragging16_9(false);
    }
    isDraggingRef.current = null;
  }, [isDragging1_1, isDragging16_9, isAnimating1_1, isAnimating16_9, swipeOffset1_1, swipeOffset16_9, handleSwipe, syncSwipeOffset]);

  useEffect(() => {
    if (isDragging1_1 || isDragging16_9) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging1_1, isDragging16_9, handleMouseMove, handleMouseUp]);

  if (!currentAd1_1 || !currentAd16_9) {
    return (
      <div className={styles.emptyState}>
        <h2>No more ads to review</h2>
        <p>All ads have been reviewed!</p>
      </div>
    );
  }

  const rotation1_1 = swipeOffset1_1 * 0.1;
  const opacity1_1 = 1 - Math.abs(swipeOffset1_1) / 500;
  const rotation16_9 = swipeOffset16_9 * 0.1;
  const opacity16_9 = 1 - Math.abs(swipeOffset16_9) / 500;

  const renderCardStack = (
    stack: '1:1' | '16:9',
    currentAd: Ad | undefined,
    leftAd: Ad | undefined,
    rightAd: Ad | undefined,
    swipeOffset: number,
    rotation: number,
    opacity: number,
    swipeDirection: 'left' | 'right' | null,
    leftCardAnimating: boolean,
    rightCardAnimating: boolean,
    cardRef: React.RefObject<HTMLDivElement | null>,
    isDragging: boolean
  ) => {
    if (!currentAd) return null;

    const size = stack === '1:1' ? { width: 374, height: 374 } : { width: 252, height: 448 };
    const stackClass = stack === '1:1' ? styles.stack1_1 : styles.stack16_9;

    return (
      <div className={`${styles.cardStack} ${stackClass}`}>
        {/* Right card */}
        {rightAd && (
          <div
            key={`right-${rightAd.id}`}
            className={`${styles.card} ${styles.cardRight} ${rightCardAnimating ? styles.cardRightAnimating : ''}`}
            data-format={stack}
            style={{ width: size.width, height: size.height }}
          >
            <div className={styles.cardImageWrapper}>
              <Image
                src={rightAd.imageUrl}
                alt="Right ad"
                fill
                className={styles.cardImage}
                style={{ objectFit: 'cover' }}
              />
            </div>
          </div>
        )}

        {/* Left card */}
        {leftAd && (
          <div
            key={`left-${leftAd.id}`}
            className={`${styles.card} ${styles.cardLeft} ${leftCardAnimating ? styles.cardLeftAnimating : ''}`}
            data-format={stack}
            style={{ width: size.width, height: size.height }}
          >
            <div className={styles.cardImageWrapper}>
              <Image
                src={leftAd.imageUrl}
                alt="Left ad"
                fill
                className={styles.cardImage}
                style={{ objectFit: 'cover' }}
              />
            </div>
          </div>
        )}

        {/* Current card */}
        <div
          key={`current-${currentAd.id}`}
          ref={cardRef}
          className={`${styles.card} ${styles.cardCurrent} ${swipeDirection === 'left' ? styles.cardSwipeLeft : ''} ${swipeDirection === 'right' ? styles.cardSwipeRight : ''}`}
          data-format={stack}
          style={{
            width: size.width,
            height: size.height,
            transform: `translate(-50%, -50%) translateX(${swipeOffset}px) rotate(${rotation}deg)`,
            opacity: opacity < 0 ? 0 : opacity,
            transition: isDragging || swipeOffset !== 0 ? 'transform 0.3s linear, opacity 0.3s linear' : 'none',
            left: '50%',
            top: '50%',
          }}
          onTouchStart={(e) => handleTouchStart(e, stack)}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={(e) => handleMouseDown(e, stack)}
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
      </div>
    );
  };

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

        {/* Mixed Cards Container */}
        <div className={styles.mixedContainer}>
          {renderCardStack(
            '1:1',
            currentAd1_1,
            leftAd1_1,
            rightAd1_1,
            swipeOffset1_1,
            rotation1_1,
            opacity1_1,
            swipeDirection1_1,
            leftCardAnimating1_1,
            rightCardAnimating1_1,
            cardRef1_1,
            isDragging1_1
          )}
          {renderCardStack(
            '16:9',
            currentAd16_9,
            leftAd16_9,
            rightAd16_9,
            swipeOffset16_9,
            rotation16_9,
            opacity16_9,
            swipeDirection16_9,
            leftCardAnimating16_9,
            rightCardAnimating16_9,
            cardRef16_9,
            isDragging16_9
          )}
        </div>

        {/* Action Buttons */}
        <div className={styles.actionButtons}>
          <button
            className={styles.deleteButton}
            onClick={() => handleSwipe('left', '1:1')}
            disabled={isAnimating1_1 || isAnimating16_9}
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
            disabled={isAnimating1_1 || isAnimating16_9}
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
            onClick={() => handleSwipe('right', '1:1')}
            disabled={isAnimating1_1 || isAnimating16_9}
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
  );
}


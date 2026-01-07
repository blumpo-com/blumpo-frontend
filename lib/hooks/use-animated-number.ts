import { useEffect, useState, useRef } from 'react';

interface UseAnimatedNumberOptions {
  target: number | null;
  duration?: number;
}

/**
 * Custom hook that animates a number from current value to target value
 * using requestAnimationFrame for smooth counting animation.
 * 
 * @param target - The target number to animate to (null means no animation)
 * @param duration - Animation duration in milliseconds (default: calculated based on distance)
 * @returns The current animated integer value
 */
export function useAnimatedNumber({ 
  target, 
  duration 
}: UseAnimatedNumberOptions): number | null {
  const [current, setCurrent] = useState<number | null>(target);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const startValueRef = useRef<number | null>(null);
  const targetRef = useRef<number | null>(target);
  const currentRef = useRef<number | null>(target);

  useEffect(() => {
    // Handle null target - no animation, just set to null
    if (target === null) {
      setCurrent(null);
      currentRef.current = null;
      targetRef.current = null;
      return;
    }

    // If target hasn't changed, don't restart animation
    if (targetRef.current === target && currentRef.current === target) {
      return;
    }

    // Cancel any ongoing animation
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    const previousValue = currentRef.current;

    // If previous value is null, set immediately to target
    if (previousValue === null) {
      setCurrent(target);
      currentRef.current = target;
      targetRef.current = target;
      return;
    }

    // Calculate duration based on distance if not provided
    const distance = Math.abs(target - previousValue);
    const calculatedDuration = duration ?? Math.min(450 + distance * 2, 650);
    
    // Store animation start values
    startValueRef.current = previousValue;
    targetRef.current = target;
    startTimeRef.current = null;

    // Animation function using easeOutCubic for smooth deceleration
    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / calculatedDuration, 1);

      // EaseOutCubic easing function: 1 - (1 - t)^3
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      const startValue = startValueRef.current!;
      const targetValue = targetRef.current!;
      const difference = targetValue - startValue;
      const currentValue = Math.round(startValue + difference * easedProgress);

      setCurrent(currentValue);
      currentRef.current = currentValue;

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        // Ensure we end exactly at target
        setCurrent(targetValue);
        currentRef.current = targetValue;
        rafRef.current = null;
        startTimeRef.current = null;
      }
    };

    // Start animation
    rafRef.current = requestAnimationFrame(animate);

    // Cleanup on unmount or when target changes
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [target, duration]);

  return current;
}


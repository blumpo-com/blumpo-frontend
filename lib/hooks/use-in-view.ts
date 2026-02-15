"use client";

import { useEffect, useRef, useState } from "react";

interface UseInViewOptions {
  once?: boolean;
  margin?: string;
  threshold?: number;
}

export function useInView(options: UseInViewOptions = {}) {
  const { once = true, margin = "0px", threshold = 0 } = options;
  const ref = useRef<HTMLElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (once && isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        } else if (!once) {
          setIsInView(false);
        }
      },
      { rootMargin: margin, threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once, margin, threshold, isInView]);

  return { ref, isInView };
}

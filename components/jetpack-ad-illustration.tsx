"use client";

import Image from "next/image";
import { useRef, useCallback, useState } from "react";
import { cn } from "@/lib/utils";

const DEFAULT_ANIMATION_SRC = "/assets/animations/9-long.webm";
const DEFAULT_ANIMATION_SECOND_SRC = "/assets/animations/9-b.webm";

const DEFAULT_AD_IMAGES = [
  "/images/dashboard/animation-ads/1.png",
  "/images/dashboard/animation-ads/2.png",
  "/images/dashboard/animation-ads/3.png",
  "/images/dashboard/animation-ads/4.png",
] as const;

const ILLUSTRATION_WIDTH = 440;
const ILLUSTRATION_HEIGHT = 300;

const videoClass = "absolute inset-0 w-full h-full object-contain z-10 scale-[1.85] translate-y-17";

export interface JetpackAdIllustrationProps {
  className?: string;
  animationSrc?: string;
  animationSecondSrc?: string;
  adImageSources?: readonly string[];
  animationAlt?: string;
  adImageAlt?: string;
}

export function JetpackAdIllustration({
  className,
  animationSrc = DEFAULT_ANIMATION_SRC,
  animationSecondSrc = DEFAULT_ANIMATION_SECOND_SRC,
  adImageSources = DEFAULT_AD_IMAGES,
  animationAlt = "Jetpack illustration",
  adImageAlt = "Ad template preview",
}: JetpackAdIllustrationProps) {
  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);
  const [showSecond, setShowSecond] = useState(false);
  const [adIndex, setAdIndex] = useState(0);
  const prevTimeRef = useRef(0);
  const sources = adImageSources.length > 0 ? adImageSources : DEFAULT_AD_IMAGES;

  const handleFirstEnded = useCallback(() => {
    setShowSecond(true);
    prevTimeRef.current = 0;
    video2Ref.current?.play().catch(() => { });
  }, []);

  const handleSecondTimeUpdate = useCallback(() => {
    const video = video2Ref.current;
    if (!video?.duration || !isFinite(video.duration)) return;
    const t = video.currentTime;
    const d = video.duration;
    if (prevTimeRef.current > d * 0.9 && t < d * 0.1) {
      setAdIndex((prev) => (prev + 1) % sources.length);
    }
    prevTimeRef.current = t;
  }, [sources.length]);

  return (
    <div className={cn("flex items-start justify-center p-4 h-[420px]", className)}>
      <div
        className="relative rounded-xl overflow-visible"
        style={{
          width: ILLUSTRATION_WIDTH,
          height: ILLUSTRATION_HEIGHT,
        }}
      >
        <Image
          key={adIndex}
          src={sources[adIndex]}
          alt={adImageAlt}
          fill
          className="object-contain"
          priority={adIndex === 0}
          sizes={`${ILLUSTRATION_WIDTH}px`}
        />
        <video
          ref={video1Ref}
          src={animationSrc}
          className={cn(videoClass, showSecond && "opacity-0 pointer-events-none")}
          autoPlay
          loop={false}
          muted
          playsInline
          aria-hidden={showSecond}
          onEnded={handleFirstEnded}
        />
        <video
          ref={video2Ref}
          src={animationSecondSrc}
          preload="auto"
          className={cn(videoClass, !showSecond && "opacity-0 pointer-events-none")}
          loop
          muted
          playsInline
          aria-label={animationAlt}
          aria-hidden={!showSecond}
          onTimeUpdate={handleSecondTimeUpdate}
        />
      </div>
    </div>
  );
}

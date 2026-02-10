"use client";

import Image from "next/image";
import { useRef, useCallback, useState } from "react";
import { cn } from "@/lib/utils";

const DEFAULT_ANIMATION_SRC = "/assets/animations/9-b.webm";

const DEFAULT_AD_IMAGES = [
  "/images/dashboard/animation-ads/1.png",
  "/images/dashboard/animation-ads/2.png",
  "/images/dashboard/animation-ads/3.png",
  "/images/dashboard/animation-ads/4.png",
] as const;

const VIDEO_OVERLAY_MAX_MOBILE = "max-w-[260px]";

export interface JetpackAdIllustrationMobileProps {
  className?: string;
  /** Only the looping animation (9-b). */
  animationSrc?: string;
  adImageSources?: readonly string[];
  animationAlt?: string;
  adImageAlt?: string;
  illustrationClassName?: string;
  adImageClassName?: string;
}

export function JetpackAdIllustrationMobile({
  className,
  animationSrc = DEFAULT_ANIMATION_SRC,
  adImageSources = DEFAULT_AD_IMAGES,
  animationAlt = "Jetpack illustration",
  adImageAlt = "Ad template preview",
  illustrationClassName,
  adImageClassName,
}: JetpackAdIllustrationMobileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [adIndex, setAdIndex] = useState(0);
  const prevTimeRef = useRef<number>(0);
  const sources = adImageSources.length > 0 ? adImageSources : DEFAULT_AD_IMAGES;

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.duration || !isFinite(video.duration)) return;

    const currentTime = video.currentTime;
    const duration = video.duration;

    if (prevTimeRef.current > duration * 0.9 && currentTime < duration * 0.1) {
      setAdIndex((prev) => (prev + 1) % sources.length);
    }

    prevTimeRef.current = currentTime;
  }, [sources.length]);

  return (
    <div
      className={cn(
        "w-full h-full my-40 flex items-center justify-center",
        className
      )}
    >
      <div

      >
        {/* Layer 1: ad template (back) */}
        <div className="absolute inset-0 flex items-center justify-center top-[-152]">
          <div
            className={cn(
              "relative",
              adImageClassName ?? "w-full max-h-full aspect-[16/10]"
            )}
          >
            <Image
              key={adIndex}
              src={sources[adIndex]}
              alt={adImageAlt}
              fill
              className="object-contain"
              priority={adIndex === 0}
            />
          </div>
        </div>
        {/* Layer 2: only 9-b video, mobile size */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={cn("relative w-full h-full", VIDEO_OVERLAY_MAX_MOBILE)}>
            <video
              ref={videoRef}
              src={animationSrc}
              className="scale-[1.4]"
              autoPlay
              loop
              muted
              playsInline
              aria-label={animationAlt}
              onTimeUpdate={handleTimeUpdate}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import { useRef, useCallback, useState } from "react";
import { cn } from "@/lib/utils";

const DEFAULT_ANIMATION_SRC = "/assets/animations/9-long.webm";
const DEFAULT_ANIMATION_SECOND_SRC = "/assets/animations/9-b.webm";
const DEFAULT_AD_IMAGE_SRC = "/images/dashboard/monday-horizontal-ad.png";

const videoBaseClass =
  "absolute inset-0 w-full h-full object-contain z-10 scale-[1.3] origin-center translate-y-19";

const VIDEO_OVERLAY_MAX = "max-w-[460px]";

export interface JetpackAdIllustrationProps {
  className?: string;
  animationSrc?: string;
  /** Second animation played after the first one ends */
  animationSecondSrc?: string;
  adImageSrc?: string;
  animationAlt?: string;
  adImageAlt?: string;
  /** Optional: Tailwind classes to size the whole image container (image only; video overlay stays fixed). E.g. "max-w-[600px] max-h-[400px]" */
  illustrationClassName?: string;
  /** Optional: Tailwind classes for the ad image wrapper, e.g. "aspect-[16/10]" */
  adImageClassName?: string;
}

export function JetpackAdIllustration({
  className,
  animationSrc = DEFAULT_ANIMATION_SRC,
  animationSecondSrc = DEFAULT_ANIMATION_SECOND_SRC,
  adImageSrc = DEFAULT_AD_IMAGE_SRC,
  animationAlt = "Jetpack illustration",
  adImageAlt = "Ad template preview",
  illustrationClassName,
  adImageClassName,
}: JetpackAdIllustrationProps) {
  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);
  const [showSecond, setShowSecond] = useState(false);

  const handleFirstEnded = useCallback(() => {
    setShowSecond(true);
    video2Ref.current?.play().catch(() => { });
  }, []);

  return (
    <div
      className={cn(
        "w-full h-full p-4 flex items-center justify-center",
        className
      )}
    >
      <div
        className={cn(
          "relative w-full h-full flex-shrink-0 rounded-xl overflow-visible scale-[1] 2xl:scale-[1.4]",
          illustrationClassName ?? "max-w-[520px]"
        )}
      >
        {/* Layer 1: ad template (back) – container can grow via illustrationClassName */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={cn(
              "relative",
              adImageClassName ?? "w-full max-h-full aspect-[16/10]"
            )}
          >
            <Image
              src={adImageSrc}
              alt={adImageAlt}
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
        {/* Layer 2: video overlay – fixed size (460px), centered; does not grow with image */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={cn("relative w-full h-full", VIDEO_OVERLAY_MAX)}>
            <video
              ref={video1Ref}
              src={animationSrc}
              className={cn(videoBaseClass, showSecond && "opacity-0 pointer-events-none")}
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
              className={cn(videoBaseClass, !showSecond && "opacity-0 pointer-events-none")}
              loop={true}
              muted
              playsInline
              aria-label={animationAlt}
              aria-hidden={!showSecond}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

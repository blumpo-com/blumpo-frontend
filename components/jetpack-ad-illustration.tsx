"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

const DEFAULT_ANIMATION_SRC = "/assets/animations/jetpack-canvas.webp";
const DEFAULT_AD_IMAGE_SRC = "/images/temp/ad-template2.png";

export interface JetpackAdIllustrationProps {
  className?: string;
  animationSrc?: string;
  adImageSrc?: string;
  animationAlt?: string;
  adImageAlt?: string;
  /** Optional: Tailwind classes to size the ad image, e.g. "w-[280px] h-[180px]" or "max-w-[90%] max-h-[50%]" */
  adImageClassName?: string;
}

export function JetpackAdIllustration({
  className,
  animationSrc = DEFAULT_ANIMATION_SRC,
  adImageSrc = DEFAULT_AD_IMAGE_SRC,
  animationAlt = "Jetpack illustration",
  adImageAlt = "Ad template preview",
  adImageClassName,
}: JetpackAdIllustrationProps) {
  return (
    <div
      className={cn(
        "w-full h-full p-4 flex items-center justify-center",
        className
      )}
    >
      <div className="relative w-full max-w-[460px] h-full flex-shrink-0 rounded-xl overflow-visible scale-[1] 2xl:scale-[1.4]">
        {/* Layer 1: ad template (back) – size via adImageClassName, no stretch */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={cn("relative", adImageClassName ?? "w-full h-full")}>
            <Image
              src={adImageSrc}
              alt={adImageAlt}
              fill
              className="object-contain"
            />
          </div>
        </div>
        {/* Layer 2: jetpack animation (front, stacked on top, 2x scale) */}
        <Image
          src={animationSrc}
          alt={animationAlt}
          fill
          className="object-contain z-10 scale-[1.3] origin-center translate-y-19"
          unoptimized
        />
      </div>
    </div>
  );
}

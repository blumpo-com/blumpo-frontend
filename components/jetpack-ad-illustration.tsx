"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

const DEFAULT_ANIMATION_SRC = "/assets/animations/jetpack-canvas.webp";
const DEFAULT_AD_IMAGE_SRC = "/images/temp/ad-template.png";

export interface JetpackAdIllustrationProps {
  className?: string;
  animationSrc?: string;
  adImageSrc?: string;
  animationAlt?: string;
  adImageAlt?: string;
}

export function JetpackAdIllustration({
  className,
  animationSrc = DEFAULT_ANIMATION_SRC,
  adImageSrc = DEFAULT_AD_IMAGE_SRC,
  animationAlt = "Jetpack illustration",
  adImageAlt = "Ad template preview",
}: JetpackAdIllustrationProps) {
  return (
    <div
      className={cn(
        "w-full h-full p-4 flex items-center justify-center",
        className
      )}
    >
      <div className="relative  h-full w-full max-w-2xl aspect-video flex-shrink-0 overflow-hidden rounded-xl z-1">
        <Image
          src={animationSrc}
          alt={animationAlt}
          width={2240}
          height={720}
          className="w-full h-full object-contain"
          unoptimized
        />
      </div>

    </div>
  );
}

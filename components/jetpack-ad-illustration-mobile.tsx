"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

const DEFAULT_ANIMATION_SRC = "/assets/animations/9-b.webp";
const DEFAULT_AD_IMAGE_SRC = "/images/dashboard/animation-ads/2.png";

const VIDEO_OVERLAY_MAX_MOBILE = "max-w-[260px]";

export interface JetpackAdIllustrationMobileProps {
  className?: string;
  /** Only the looping animation (9-b). */
  animationSrc?: string;
  /** Static ad image (no rotation). */
  adImageSrc?: string;
  animationAlt?: string;
  adImageAlt?: string;
  illustrationClassName?: string;
  adImageClassName?: string;
}

export function JetpackAdIllustrationMobile({
  className,
  animationSrc = DEFAULT_ANIMATION_SRC,
  adImageSrc = DEFAULT_AD_IMAGE_SRC,
  animationAlt = "Jetpack illustration",
  adImageAlt = "Ad template preview",
  illustrationClassName,
  adImageClassName,
}: JetpackAdIllustrationMobileProps) {

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
              src={adImageSrc}
              alt={adImageAlt}
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
        {/* Layer 2: only 9-b animated WebP, mobile size */}
        <div className="absolute inset-0 flex items-center justify-center top-[-40]">
          <div className={cn("relative w-full h-full", VIDEO_OVERLAY_MAX_MOBILE)}>
            <img
              src={animationSrc}
              alt={animationAlt}
              className="w-full h-full object-contain z-10 scale-[1.5]"
              fetchPriority="high"
              loading="eager"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

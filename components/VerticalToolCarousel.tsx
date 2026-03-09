"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";

function Slot({
  image,
  wrapperClassName,
}: {
  image: { src: string; alt: string };
  wrapperClassName?: string;
}) {
  return (
    <span
      className={cn(
        "absolute inset-0 flex items-center justify-start gap-2",
        wrapperClassName
      )}
    >
      <Image
        src={image.src}
        alt={image.alt}
        width={40}
        height={24}
        className="h-6 w-auto shrink-0 object-contain md:h-8"
      />
      <span className="shrink-0 text-sm font-medium text-foreground md:text-base">
        {image.alt}
      </span>
    </span>
  );
}

export function VerticalToolCarousel({
  images,
  className,
}: {
  images: { src: string; alt: string }[];
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setIsTransitioning(true);
      const t = setTimeout(() => {
        setIndex((i) => (i + 1) % images.length);
        setIsTransitioning(false);
      }, 400);
      return () => clearTimeout(t);
    }, 3000 + 400);
    return () => clearInterval(interval);
  }, [images.length]);

  const nextIndex = (index + 1) % images.length;

  if (images.length === 0) return null;
  if (images.length === 1) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-2 align-middle",
          className
        )}
      >
        <Image
          src={images[0].src}
          alt={images[0].alt}
          width={40}
          height={24}
          className="h-5 w-auto shrink-0 object-contain md:h-6"
        />
        <span className="shrink-0 text-sm font-medium text-foreground md:text-base">
          {images[0].alt}
        </span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 align-middle overflow-hidden rounded-lg",
        className
      )}
      style={{ height: 34 }}
    >
      <span className="relative block h-full w-[120px]">
        {isTransitioning ? (
          <>
            <Slot
              image={images[index]}
              wrapperClassName="z-10 animate-slide-out-top"
            />
            <Slot
              image={images[nextIndex]}
              wrapperClassName="z-0 animate-slide-in-from-bottom"
            />
          </>
        ) : (
          <Slot image={images[index]} />
        )}
      </span>
    </span>
  );
}

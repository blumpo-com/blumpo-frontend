"use client";

import { WallImage } from "./wall-image";

export function HeroPhotoWall() {
  const images = [
    { filename: "1.png", alt: "Hero Photo Wall" },
    { filename: "2.png", alt: "Hero Photo Wall" },
    { filename: "1.png", alt: "Hero Photo Wall" },
    { filename: "2.png", alt: "Hero Photo Wall" },
    { filename: "1.png", alt: "Hero Photo Wall" },
    
  ];

  // Duplicate images twice for seamless loop
  // One set = 3 images (117px each) + 2 gaps (15px each) = 381px total
  // Animation moves exactly -381px, so when it loops, the second set is in the same position
  const duplicatedImages = [...images, ...images,  ...images,  ...images];

  return (
    <>
      {/* Desktop: Vertical columns (2 columns) */}
      <div className="hidden lg:flex gap-4">
        <div className="w-1/2 h-[600px] overflow-hidden relative">
          {/* Gradient mask */}
          <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />

          {/* Animated container */}
          <div className="flex flex-col gap-4 animate-scroll-down">
            {duplicatedImages.map((img, index) => (
              <WallImage
                key={`left-${index}`}
                filename={img.filename}
                alt={img.alt}
              />
            ))}
          </div>
        </div>

        <div className="w-1/2 h-[600px] overflow-hidden relative">
          {/* Gradient mask */}
          <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />

          {/* Animated container with a delay */}
          <div
            className="flex flex-col gap-4 animate-scroll-down pt-8"
            style={{ animationDelay: "-10s" }}
          >
            {duplicatedImages.map((img, index) => (
              <WallImage
                key={`right-${index}`}
                filename={img.filename}
                alt={img.alt}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

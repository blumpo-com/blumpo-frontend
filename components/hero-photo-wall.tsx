"use client";

import { WallImage } from "./wall-image";

export function HeroPhotoWall() {
  const images = [
    { filename: "1.png", alt: "Hero Photo Wall" },
    { filename: "2.png", alt: "Hero Photo Wall" },
    { filename: "1.png", alt: "Hero Photo Wall" },
  ];

  const duplicatedImages = [...images, ...images];

  return (
    <>
      {/* Mobile: Horizontal wall with 2 rows */}
      <div className="lg:hidden w-full overflow-hidden relative mt-8">
        {/* Gradient mask from right */}
        <div className="absolute top-0 bottom-0 right-0 w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute top-0 bottom-0 left-0 w-20 bg-gradient-to-r from-[#D3F1FA] to-transparent z-10 pointer-events-none" />
        {/* Container with 2 rows */}
        <div className="flex flex-col gap-[15px] h-full mx-10">
          {/* Top row */}
          <div className="relative w-full h-[119px] overflow-hidden">
            <div className="absolute flex gap-[15px] animate-scroll-right" style={{ width: "max-content" }}>
              {duplicatedImages.map((img, index) => (
                <div key={`top-${index}`} className="shrink-0 w-[117px] h-[119px]">
                  <WallImage
                    filename={img.filename}
                    alt={img.alt}
                    width={117}
                    height={119}
                  />
                </div>
              ))}
            </div>
          </div>
          
          {/* Bottom row with delay */}
          <div className="relative w-full h-[119px] overflow-hidden">
            <div 
              className="absolute flex gap-[15px] animate-scroll-right"
              style={{ width: "max-content", animationDelay: "-10s" }}
            >
              {duplicatedImages.map((img, index) => (
                <div key={`bottom-${index}`} className="shrink-0 w-[117px] h-[119px]">
                  <WallImage
                    filename={img.filename}
                    alt={img.alt}
                    width={117}
                    height={119}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

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

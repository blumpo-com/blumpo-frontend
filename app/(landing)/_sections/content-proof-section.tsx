"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

const buttons = [
  { id: 1, label: "Problem-solution" },
  { id: 2, label: "Testimonial" },
  { id: 3, label: "Meme" },
  { id: 4, label: "Value propositiom" },
];

// 12 images total - 3 per section
// Each image can be individually customized
const allImages = [
  { src: "/images/landing/content-proof/problem-solution/1.avif", alt: "Content proof image", rotation: -5, delay: "0s" },
  { src: "/images/landing/content-proof/problem-solution/2.avif", alt: "Content proof image", rotation: 0, delay: "0.5s" },
  { src: "/images/landing/content-proof/problem-solution/3.avif", alt: "Content proof image", rotation: 5, delay: "1s" },
  { src: "/images/landing/content-proof/testimonial/1.avif", alt: "Content proof image", rotation: 0, delay: "0.5s" },
  { src: "/images/landing/content-proof/testimonial/2.avif", alt: "Content proof image", rotation: 5, delay: "1s" },
  { src: "/images/landing/content-proof/testimonial/3.avif", alt: "Content proof image", rotation: -5, delay: "0s" },
  { src: "/images/landing/content-proof/meme/1.avif", alt: "Content proof image", rotation: 5, delay: "1s" },
  { src: "/images/landing/content-proof/meme/2.avif", alt: "Content proof image", rotation: -5, delay: "0s" },
  { src: "/images/landing/content-proof/meme/3.avif", alt: "Content proof image", rotation: 0, delay: "0.5s" },
  { src: "/images/landing/content-proof/value-proposition/1.avif", alt: "Content proof image", rotation: 5, delay: "1s" },
  { src: "/images/landing/content-proof/value-proposition/2.avif", alt: "Content proof image", rotation: -5, delay: "0s" },
  { src: "/images/landing/content-proof/value-proposition/3.avif", alt: "Content proof image", rotation: 0, delay: "0.5s" },

];

// Images per section: 3, 4, 3, 4 = 14 total
const imagesPerSection = [3, 3, 3, 3];

export function ContentProofSection() {
  const [activeButton, setActiveButton] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Get images for current section
  const getImagesForSection = (sectionIndex: number) => {
    let startIndex = 0;
    for (let i = 0; i < sectionIndex; i++) {
      startIndex += imagesPerSection[i];
    }
    const count = imagesPerSection[sectionIndex];
    return allImages.slice(startIndex, startIndex + count);
  };

  const images = getImagesForSection(activeButton);

  // Reset image index when section changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [activeButton]);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0]?.clientX ?? null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0]?.clientX ?? null;
  };

  const handleTouchEnd = () => {
    const start = touchStartX.current;
    const end = touchEndX.current;
    if (start == null || end == null) return;

    const distance = start - end;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) goToNext();
    else if (distance < -minSwipeDistance) goToPrevious();

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const goToNext = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const goToPrevious = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="mt-12 flex flex-col items-center bg-background">
      <div className="grid grid-cols-2 md:grid-cols-4 md:flex md:flex-row gap-4 max-w-md md:max-w-none md:justify-center">
        {buttons.map((button, index) => (
          <Button
            key={button.id}
            variant="outline"
            onClick={() => setActiveButton(index)}
            className={cn(
              "w-full md:w-auto px-6",
              "hover:bg-foreground hover:text-background",
              activeButton == index ? "bg-foreground text-background" : ""
            )}
          >
            {button.label}
          </Button>
        ))}
      </div>

      {/* Desktop: All sections pre-rendered and stacked - only active visible (images load on mount for instant switching) */}
      <div className="hidden md:flex mt-8 w-full h-100 md:h-146 rounded-2xl relative overflow-hidden items-center justify-center px-8">
        {buttons.map((_, sectionIndex) => {
          const sectionImages = getImagesForSection(sectionIndex).slice(0, 3);
          const fixedDelays = ["0s", "0.5s", "1s"];
          const rotations = ["-rotate-5", "rotate-0", "rotate-5"];
          return (
            <div
              key={sectionIndex}
              aria-hidden={activeButton !== sectionIndex}
              className={cn(
                "absolute inset-0 flex gap-6 lg:gap-12 items-center justify-center z-10 transition-opacity duration-300",
                activeButton === sectionIndex ? "opacity-100" : "opacity-0 pointer-events-none"
              )}
            >
              {sectionImages.map((image, index) => (
                <div
                  key={index}
                  className={cn(
                    "relative rounded-lg shadow-lg animate-float-up-down",
                    rotations[index]
                  )}
                  style={{ animationDelay: fixedDelays[index] }}
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    width={360}
                    height={360}
                    className="rounded-lg object-cover"
                    priority={sectionIndex === 0 && index === 1}
                  />
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Mobile: All carousels pre-rendered and stacked - only active visible (images load on mount for instant switching) */}
      <div
        className="md:hidden mt-8 w-full rounded-2xl relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        ref={carouselRef}
      >
        <div className="relative h-[400px] overflow-hidden">
          {buttons.map((_, sectionIndex) => {
            const sectionImages = getImagesForSection(sectionIndex);
            return (
              <div
                key={sectionIndex}
                aria-hidden={activeButton !== sectionIndex}
                className={cn(
                  "absolute inset-0 transition-opacity duration-300",
                  activeButton === sectionIndex ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
              >
                <div
                  className="flex h-full transition-transform duration-300 ease-in-out"
                  style={{
                    transform: `translateX(-${currentImageIndex * 100}%)`,
                  }}
                >
                  {sectionImages.map((image, index) => (
                    <div
                      key={index}
                      className="w-full flex-shrink-0 flex items-center justify-center px-8"
                    >
                      <Image
                        src={image.src}
                        alt={image.alt}
                        width={200}
                        height={200}
                        className="rounded-lg object-cover shadow-lg w-80 h-auto max-h-[350px]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Navigation arrows */}
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-colors"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6 text-gray-800" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-colors"
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6 text-gray-800" />
          </button>

          {/* Dots indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  index === currentImageIndex
                    ? "bg-foreground w-6"
                    : "bg-gray-200 "
                )}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

const buttons = [
  { id: "blue", label: "Problem-solution", gradient: "gradient-blue" },
  { id: "green", label: "Testimonial", gradient: "gradient-green" },
  { id: "purple", label: "Promotion", gradient: "gradient-purple" },
  { id: "orange", label: "Product demonstration", gradient: "gradient-orange" },
];

const images = [
  { src: "/images/hero/1.png", alt: "Content proof image", rotation: -5, delay: "0s" },
  { src: "/images/hero/1.png", alt: "Content proof image", rotation: 0, delay: "0.5s" },
  { src: "/images/hero/1.png", alt: "Content proof image", rotation: 5, delay: "1s" },
];

export function ContentProofSection() {
  const [activeButton, setActiveButton] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(0);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext();
    }
    if (isRightSwipe) {
      goToPrevious();
    }
  };

  const goToNext = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const goToPrevious = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="mt-12 flex flex-col items-center">
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

      {/* Desktop: Stacked images */}
      <div className="hidden md:flex mt-8 w-full h-100 md:h-146 rounded-2xl relative overflow-hidden items-center justify-center transition-all duration-500 ease-in-out">
        {/* Gradient backgrounds with opacity transition */}
        {buttons.map((button, index) => (
          <div
            key={button.id}
            className={`absolute inset-0 ${
              button.gradient
            } transition-opacity duration-500 ease-in-out ${
              activeButton === index ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        {images.map((image, index) => (
          <Image
            key={index}
            src={image.src}
            alt={image.alt}
            width={300}
            height={300}
            className={cn(
              "absolute rounded-lg object-cover shadow-lg animate-float-up-down",
              index === 0 && "left-[10%] -rotate-5",
              index === 1 && "left-1/2 -translate-x-1/2 rotate-0",
              index === 2 && "right-[10%] rotate-5"
            )}
            style={{ animationDelay: image.delay }}
          />
        ))}
      </div>

      {/* Mobile: Swipeable carousel */}
      <div 
        className="md:hidden mt-8 w-full rounded-2xl relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        ref={carouselRef}
      >
        {/* Gradient background */}
        <div
          className={`absolute inset-0 ${
            buttons[activeButton].gradient
          } transition-opacity duration-500 ease-in-out opacity-100`}
        />
        
        {/* Carousel container */}
        <div className="relative h-[400px] overflow-hidden">
          {/* Images container with transform */}
          <div
            className="flex h-full transition-transform duration-300 ease-in-out"
            style={{
              transform: `translateX(-${currentImageIndex * 100}%)`,
            }}
          >
            {images.map((image, index) => (
              <div
                key={index}
                className="w-full flex-shrink-0 flex items-center justify-center px-8"
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={300}
                  height={300}
                  className="rounded-lg object-cover shadow-lg w-80 h-auto max-h-[350px]"
                />
              </div>
            ))}
          </div>

          {/* Navigation arrows */}
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-colors"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6 text-gray-800" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-colors"
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6 text-gray-800" />
          </button>

          {/* Dots indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
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

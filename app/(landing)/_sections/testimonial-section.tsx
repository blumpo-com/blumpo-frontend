"use client";

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Testimonial {
  id: number;
  name: string;
  role: string;
  text: string;
  avatar: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Ed Park",
    role: "Founder",
    text: "Honestly didn't expect much, but Blumpo saves hours for us. Not every ad is perfect, but it's so easy to regenerate that it's not an issue. We move from 10 to 100 ads on Meta and volume makes a difference.",
    avatar: "/images/landing/testimonial/ed-park.png",
  },
  {
    id: 2,
    name: "Thomas Sanders",
    role: "Head of Growth",
    text: "Agencies were taking forever and costing a fortune. Blumpo's faster and honestly just as good for most of our campaigns.",
    avatar: "/images/landing/testimonial/t-sanders.png",
  },
  {
    id: 3,
    name: "Sarah Norman",
    role: "Agency Owner",
    text: "Client turnaround time went from weeks to days. The research and variety are solid, and we're delivering way more concepts per campaign now",
    avatar: "/images/landing/testimonial/sarah-norman.png",
  },
  {
    id: 4,
    name: "Natalia Wojnarowicz",
    role: "Head of Marketing",
    text: "The variety of ad archetypes is amazing. We've tested over 100 Blumpo creatives on average they have 12% higher ROAS than the ones from the agency!",
    avatar: "/images/landing/testimonial/n-wojnarowicz.png",
  },
  {
    id: 5,
    name: "Monica Bessant",
    role: "Graphic Designer",
    text: "Automates the research, ideation, and creation. We still make some ads manually, but it's dropped from 100% to under 30% of our work",
    avatar: "/images/landing/testimonial/monica-bessant.png",
  },
  {
    id: 6,
    name: "Igor Uchnast",
    role: "Start-up founder",
    text: "Blumpo's customer research from Reddit and social media is incredible. Super easy to use. Zero prompts required to create +20 ads every day.",
    avatar: "/images/landing/testimonial/igor-uchnast.png",
  },
];


function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div className="rounded-[20px] p-[2px] gradient-primary h-full">
      <div className="bg-white rounded-[18px] p-6 h-full shadow-lg pb-12 sm:pb-20">
        {/* Avatar and name */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
            <Image
              src={testimonial.avatar}
              alt={testimonial.name}
              width={48}
              height={48}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h3 className="font-bold text-[#0a0a0a] text-base">
              {testimonial.name}
            </h3>
            <p className="text-sm text-gray-600">
              {testimonial.role}
            </p>
          </div>
        </div>

        {/* Testimonial text */}
        <p className="text-[#0a0a0a] text-base leading-relaxed">
          "{testimonial.text}"
        </p>
      </div>
    </div>
  );
}


export function TestimonialSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
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
      goToNext({ mobile: true });
    }
    if (isRightSwipe) {
      goToPrevious({ mobile: true });
    }
  };

  const goToNext = ({ mobile = false }: { mobile?: boolean }) => {

    if (mobile) {
      setCurrentIndex((prev) => (prev + 1) % (testimonials.length));
    } else {
      setCurrentIndex((prev) => (prev + 1) % (testimonials.length - 1));
    }
  };

  const goToPrevious = ({ mobile = false }: { mobile?: boolean }) => {
    if (mobile) {
      setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    } else {
      setCurrentIndex((prev) => (prev - 1 + (testimonials.length - 1)) % (testimonials.length - 1));
    }
  };


  return (
    <div className="mt-12 w-full">
      {/* Desktop: 3 cards carousel */}
      <div className="hidden md:block relative">
        <div className="flex items-center gap-6 justify-center">
          {/* Left arrow */}
          <button
            onClick={() => goToPrevious({ mobile: false })}
            className="z-10 bg-black hover:bg-gray-800 rounded-full p-3 shadow-lg transition-colors flex-shrink-0 cursor-pointer"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>

          {/* Cards container */}
          <div className="flex gap-6 flex-1 max-w-8xl overflow-hidden relative">
            <div
              className="flex gap-6 transition-transform duration-300 ease-in-out"
              style={{
                transform: `translateX(-${currentIndex * (100 / 3)}%)`,
              }}
            >
              {testimonials.map((testimonial) => {
                return (
                  <div
                    key={testimonial.id}
                    className="flex-shrink-0"
                    style={{ width: "calc(33.333% - 1rem)" }}
                  >
                    <TestimonialCard testimonial={testimonial} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right arrow */}
          <button
            onClick={() => goToNext({ mobile: false })}
            className="z-10 bg-black hover:bg-gray-800 rounded-full p-3 shadow-lg transition-colors flex-shrink-0 cursor-pointer"
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Dots indicator - Desktop */}
        <div className="flex justify-center gap-2 mt-6">
          {testimonials.slice(0, -1).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "h-2 rounded-full transition-all",
                index === currentIndex
                  ? "bg-foreground w-8"
                  : "bg-gray-200 w-2"
              )}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Mobile: Single card swipeable carousel */}
      <div className="md:hidden relative">
        <div className="flex items-center gap-4">
          {/* Left arrow */}
          <button
            onClick={() => goToPrevious({ mobile: true })}
            className="z-10 bg-black hover:bg-gray-800 rounded-full p-2 shadow-lg transition-colors flex-shrink-0"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>

          {/* Carousel container */}
          <div
            className="flex-1 relative overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            ref={carouselRef}
          >
            <div
              className="flex transition-transform duration-300 ease-in-out"
              style={{
                transform: `translateX(-${currentIndex * 100}%)`,
              }}
            >
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.id}
                  className="w-full flex-shrink-0"
                >
                  <TestimonialCard testimonial={testimonial} />
                </div>
              ))}
            </div>


          </div>

          {/* Right arrow */}
          <button
            onClick={() => goToNext({ mobile: true })}
            className="z-10 bg-black hover:bg-gray-800 rounded-full p-2 shadow-lg transition-colors flex-shrink-0"
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>
        {/* Dots indicator - Mobile */}
        <div className="flex justify-center gap-2 mt-6">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "h-2 rounded-full transition-all",
                index === currentIndex
                  ? "bg-foreground w-6"
                  : "bg-gray-200 w-2"
              )}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}


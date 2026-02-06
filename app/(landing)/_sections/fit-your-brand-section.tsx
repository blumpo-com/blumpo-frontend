"use client";

import { useRef, useState, useEffect } from "react";
import { DiscoBall } from "@/components/disco-ball";
import { cn } from "@/lib/utils";
import { BookOpen, Users, Search } from "lucide-react";
import Image from "next/image";

interface UnderstandCardProps {
  title: string;
  description: string;
  type: "customers" | "competition" | "product" | "style" | "team";
}

const RAPID_CLICKS = 4;
const RAPID_WINDOW_MS = 1500;

function BlumpoAnimation({ className }: { className?: string }) {
  const clickCountRef = useRef(0);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onPlay = () => setIsMusicPlaying(true);
    const onPause = () => setIsMusicPlaying(false);
    const onEnded = () => setIsMusicPlaying(false);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const handleClick = () => {
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }

    clickCountRef.current += 1;

    if (clickCountRef.current >= RAPID_CLICKS) {
      clickCountRef.current = 0;
      try {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(() => { });
        }
      } catch {
        // ignore autoplay errors
      }
      return;
    }

    resetTimeoutRef.current = setTimeout(() => {
      clickCountRef.current = 0;
      resetTimeoutRef.current = null;
    }, RAPID_WINDOW_MS);
  };

  return (
    <div className={cn("relative w-full h-full", className)}>
      <button
        type="button"
        onClick={handleClick}
        className="block cursor-pointer w-full h-full"
        aria-label="Blumpo"
      >
        <Image
          src="/assets/animations/disco-blumpo.webp"
          alt="Disco Blumpo"
          width={260}
          height={260}
          className={cn("object-cover", "w-full h-full")}
          unoptimized
        />
      </button>
      {isMusicPlaying && (
        <>
          <DiscoBall className="absolute left-1/2 top-0" />
          {/* Trzy kolorowe światła od kuli disco */}
          <div
            className="absolute top-[15%] left-[10%] w-24 h-24 rounded-full pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgba(255,150,180,0.5) 0%, transparent 70%)",
              filter: "blur(12px)",
            }}
            aria-hidden
          />
          <div
            className="absolute top-[12%] right-[8%] w-28 h-28 rounded-full pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgba(150,255,180,0.5) 0%, transparent 70%)",
              filter: "blur(14px)",
            }}
            aria-hidden
          />
          <div
            className="absolute bottom-[18%] right-[12%] w-30 h-30 rounded-full pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgba(255,180,220,0.45) 0%, transparent 70%)",
              filter: "blur(10px)",
            }}
            aria-hidden
          />
        </>
      )}
      <audio ref={audioRef} src="/assets/music/blumpo-theme.mp3" loop />
    </div>
  );
}
function UnderstandCard({ title, description, type }: UnderstandCardProps) {
  const renderIcon = () => {
    switch (type) {
      case "customers":
        return (
          <div className="flex items-center gap-2">
            {/* Reddit, Facebook, YouTube icons - placeholder for now */}
            <div className="w-[23px] h-[23px] rounded-full">
              <img src="/assets/social/Reddit-logo.png" alt="Reddit" className="w-full h-full object-cover" />
            </div>
            <div className="w-[23px] h-[23px] rounded-full">
              <img src="/assets/social/Facebook-logo.png" alt="Facebook" className="w-full h-full object-cover" />
            </div>
            <div className="w-[23px] h-[23px] rounded-full">
              <img src="/assets/social/Youtube-logo.png" alt="Youtube" className="w-full h-full object-cover" />
            </div>
          </div>
        );
      case "competition":
        return (
          <div className="border-2 border-[#00bfa6] rounded-full w-[52px] h-[25px] flex items-center justify-center px-[10px] py-[8px]">
            <img src="/assets/icons/person-search.svg" alt="Search" className="h-[20px]  object-cover" />
          </div>
        );
      case "product":
        return (
          <div className="border-2 border-[#00bfa6] rounded-full w-[52px] h-[25px] flex items-center justify-center px-[10px] py-[8px]">
            <img src="/assets/icons/menu-book.svg" alt="Search" className="h-[20px]  object-cover" />
          </div>
        );
      case "style":
        return (
          <div className="flex items-center">
            {/* Color palette - overlapping circles */}
            {["#ffffff", "#3F86C6", "#888e98", "#FF0000", "#800080"].map((color, index) => (
              <div
                key={index}
                className="w-[20px] h-[20px] rounded-full border border-gray-300"
                style={{
                  backgroundColor: color,
                  marginLeft: index > 0 ? "-6px" : "0",
                }}
              />
            ))}
          </div>
        );
      case "team":
        return (
          <div className="flex items-center gap-3 justify-center">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="border-2 border-[#00bfa6] rounded-full w-8 h-8 flex items-center justify-center"
              >
                <img src="/assets/icons/person.svg" alt="Search" className="h-[20px] object-cover" />
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        "bg-white border-2 border-[#00bfa6] rounded-[20px] flex flex-col gap-[10px] px-[15px] py-5 regular-shadow",
        // Mobile
        "w-full",
        // Desktop
        "md:w-full lg:w-[320px]",
        // Height for team card is taller
        type === "team" ? "h-[280px] md:h-52" : "h-[228px]"
      )}
    >
      <h3 className="text-[20px] font-normal text-[#0a0a0a] leading-normal">
        {title}
      </h3>
      <p className="text-base font-normal text-[#888e98] leading-normal">
        {description}
      </p>
      <div className="mt-auto">{renderIcon()}</div>
    </div>
  );
}

const cards = [
  {
    title: "We understand your customers",
    description:
      "Blumpo scans Reddit, Facebook, and YouTube to uncover what your customers want—and how they talk about it.",
    type: "customers" as const,
  },
  {
    title: "We benchmark your competition",
    description:
      "We analyze your competitors' ads to spot what works—and where your brand can win.",
    type: "competition" as const,
  },
  {
    title: "We understand your product",
    description:
      "We learn what makes your product unique—its benefits, use cases—so every ad speaks directly to its real value.",
    type: "product" as const,
  },
  {
    title: "We understand your style",
    description:
      "Blumpo studies your website to capture your brand's tone, color palette, and visual style - so every ad feels perfectly on brand.",
    type: "style" as const,
  },
  {
    title: "We know how to create winning creatives!",
    description:
      "Our team is a mix of top engineers and marketers, who deeply understand ad creation, platform algorithms, and what truly drives sales.",
    type: "team" as const,
  },
];

export function FitYourBrandSection() {
  return (
    <div className="mt-12 flex flex-col items-center">
      {/* Mobile: Cards in column with illustration in middle */}
      <div className="w-full md:hidden flex flex-col gap-5 items-center">
        {/* First 2 cards */}
        <UnderstandCard
          title={cards[0].title}
          description={cards[0].description}
          type={cards[0].type}
        />
        <UnderstandCard
          title={cards[1].title}
          description={cards[1].description}
          type={cards[1].type}
        />

        {/* Central Illustration */}
        <div className="relative w-[260px] h-[260px] my-5">
          <BlumpoAnimation className="w-full h-full object-cover" />
        </div>

        {/* Remaining cards */}
        <UnderstandCard
          title={cards[2].title}
          description={cards[2].description}
          type={cards[2].type}
        />
        <UnderstandCard
          title={cards[3].title}
          description={cards[3].description}
          type={cards[3].type}
        />
        <UnderstandCard
          title={cards[4].title}
          description={cards[4].description}
          type={cards[4].type}
        />
      </div>

      {/* Medium screens (md to lg): 2 cards per row, image, 2 cards, 1 wide card */}
      <div className="hidden md:block lg:hidden w-full max-w-[1152px] px-4">
        <div className="grid grid-cols-2 gap-5">
          {/* First 2 cards */}
          <UnderstandCard
            title={cards[0].title}
            description={cards[0].description}
            type={cards[0].type}
          />
          <UnderstandCard
            title={cards[1].title}
            description={cards[1].description}
            type={cards[1].type}
          />

          {/* Central Illustration - full width */}
          <div className="relative w-full h-[352px] col-span-2 flex justify-center my-5">
            <BlumpoAnimation className="w-[352px]  h-full object-cover" />
          </div>

          {/* Next 2 cards */}
          <UnderstandCard
            title={cards[2].title}
            description={cards[2].description}
            type={cards[2].type}
          />
          <UnderstandCard
            title={cards[3].title}
            description={cards[3].description}
            type={cards[3].type}
          />

          {/* Wide team card - full width */}
          <div className="col-span-2">
            <UnderstandCard
              title={cards[4].title}
              description={cards[4].description}
              type={cards[4].type}
            />
          </div>
        </div>
      </div>

      {/* Desktop: Grid layout with 2x2 + illustration in center + 1 wide card at bottom */}
      <div className="hidden lg:block w-full max-w-[1152px]">
        {/* Grid container for cards and illustration */}
        <div className="relative flex justify-between max-w-[1097px] mx-auto">
          {/* Left column */}
          <div className="flex flex-col gap-[45px]">
            {/* Top left - Customers */}
            <UnderstandCard
              title={cards[0].title}
              description={cards[0].description}
              type={cards[0].type}
            />

            {/* Bottom left - Competition */}
            <UnderstandCard
              title={cards[1].title}
              description={cards[1].description}
              type={cards[1].type}
            />
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-[45px]">
            {/* Top right - Product */}
            <UnderstandCard
              title={cards[2].title}
              description={cards[2].description}
              type={cards[2].type}
            />

            {/* Bottom right - Style */}
            <UnderstandCard
              title={cards[3].title}
              description={cards[3].description}
              type={cards[3].type}
            />
          </div>

          {/* Central Illustration - positioned absolutely in center */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[352px] h-[352px] pointer-events-none">
            <BlumpoAnimation className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Wide team card at bottom - centered */}
        <div className="flex justify-center mt-[45px]">
          <div
            className={cn(
              "bg-[#f9fafb] border-2 border-[#00bfa6] rounded-[20px] flex flex-col gap-[10px] px-[15px] py-5 regular-shadow",
              "w-[538px] h-[178px] items-center text-center justify-center"
            )}
          >
            <h3 className="text-[20px] font-normal text-[#0a0a0a] leading-normal">
              {cards[4].title}
            </h3>
            <p className="text-base font-normal text-[#888e98] leading-normal">
              {cards[4].description}
            </p>
            <div className="flex items-center gap-[34px] justify-center mt-auto">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="border-2 border-[#00bfa6] rounded-full w-[34px] h-[34px] flex items-center justify-center"
                >
                  <img src="/assets/icons/person.svg" alt="Search" className="h-[20px] object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


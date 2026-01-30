"use client";

import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";
import Image from "next/image";

interface ComparisonRow {
  feature: string;
  blumpo: boolean;
  chatgpt: boolean;
  canva: boolean;
  otherAiTools: boolean;
}

const comparisonData: ComparisonRow[] = [
  {
    feature: "High-performing design",
    blumpo: true,
    chatgpt: false,
    canva: false,
    otherAiTools: true,
  },
  {
    feature: "Customer research on 3rd party platforms",
    blumpo: true,
    chatgpt: false,
    canva: false,
    otherAiTools: false,
  },
  {
    feature: "Tailored to B2B segment",
    blumpo: true,
    chatgpt: false,
    canva: false,
    otherAiTools: false,
  },
  {
    feature: "Easy-to-use",
    blumpo: true,
    chatgpt: true,
    canva: false,
    otherAiTools: false,
  },
  {
    feature: "Multi-language support",
    blumpo: true,
    chatgpt: true,
    canva: false,
    otherAiTools: true,
  },
];

function ComparisonIcon({ checked }: { checked: boolean }) {
  return (
    <div className="w-8 h-8 md:w-12 md:h-12 xl:w-20  flex items-center justify-center">
      {checked ? (
        <Image
          src="/assets/icons/Check.svg"
          alt="Check"
          width={28}
          height={28}
          className="w-6 h-6 md:w-7 md:h-7 object-contain"
        />
      ) : (
        <Image
          src="/assets/icons/Cancel.svg"
          alt="Cancel"
          width={28}
          height={28}
          className="w-6 h-6 md:w-7 md:h-7 object-contain"
        />
      )}
    </div>
  );
}

function ComparisonImage({ src, alt, width, height, blumpoLogo = false }: { src: string, alt: string, width: number, height: number, blumpoLogo?: boolean }) {
  return (
    <div className="flex items-center justify-center w-8 h-8 md:w-12 md:h-12 xl:w-20">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={cn(
          blumpoLogo ? "w-8  md:w-10  xl:w-14" : "w-6 h-6 md:w-8 md:h-8"
        )}
      />
    </div>
  );
}

export function ComparisonSection() {
  return (
    <div className="mt-12 max-w-6xl mx-auto">
      {/* Comparison Table Container */}
      <div
        className={cn(
          "bg-white border-2 border-[#00bfa6] rounded-[25px] shadow-[0px_0px_8px_4px_rgba(0,0,0,0.05)]",
          "px-4 py-4 md:px-6 md:py-5 xl:px-[34px]",
          "w-full"
        )}
      >
        {/* Header with Tool Logos */}
        <div
          className={cn(
            "flex flex-col md:flex-row items-start md:items-center justify-between",
            "gap-4 md:gap-6 xl:gap-[118px]",
            "pb-1",
            "mb-4 md:mb-5 "
          )}
        >


          <div className="flex items-center justify-end w-full md:w-auto flex-1 gap-6 sm:gap-20 xl:gap-30">
            {/* Blumpo */}
            <ComparisonImage src="/assets/animations/sitting-blumpo-narrow.webp" alt="Blumpo" width={48} height={48} blumpoLogo={true} />

            {/* ChatGPT */}
            <ComparisonImage src="/assets/social/chatgpt-logo.png" alt="ChatGPT" width={36} height={36} />

            {/* Canva */}
            <ComparisonImage src="/assets/social/canva-logo.png" alt="Canva" width={36} height={36} />

            {/* Other AI tools */}
            <div className="w-8 h-8 md:w-12 md:h-12 xl:w-20 xl:h-20 flex items-center justify-center">
              <span
                className={cn(
                  "text-xs md:text-sm xl:text-md font-medium text-[#0a0a0a] text-center",
                )}
              >
                Other AI tools
              </span>
            </div>
          </div>
        </div>

        {/* Comparison Rows */}
        <div className="flex flex-col">
          {comparisonData.map((row, index) => (
            <div
              key={index}
              className={cn(
                "flex  md:items-center",
                "py-4 md:py-5",
                "gap-3 md:gap-0",
                "border-b border-[#c8c8c8]",
                index === comparisonData.length - 1 && "border-b-0"
              )}
            >
              {/* Feature Name */}
              <div
                className={cn(

                  "w-full md:w-auto sm:max-w-40 md:max-w-100 xl:min-w-[385px]",
                  "pr-0 md:pr-8 xl:pr-[77px]"
                )}
              >
                <p
                  className={cn(
                    "text-sm md:text-base font-normal text-[#0a0a0a]",
                    "leading-normal"
                  )}
                >
                  {row.feature}
                </p>
              </div>

              {/* Icons Row */}
              <div
                className={cn(
                  "flex items-center justify-end",
                  "gap-6 sm:gap-20 xl:gap-30",
                  "flex-1"
                )}
              >
                <ComparisonIcon checked={row.blumpo} />
                <ComparisonIcon checked={row.chatgpt} />
                <ComparisonIcon checked={row.canva} />
                <ComparisonIcon checked={row.otherAiTools} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


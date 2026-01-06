"use client";

import { cn } from "@/lib/utils";

interface Step {
  number: string;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    number: "01",
    title: "Input your URL",
    description: "Paste your website link, and Blumpo will automatically scan your site to gather your brand assets — including logo, typography, and colors.",
  },
  {
    number: "02",
    title: "Market research",
    description: "Blumpo AI researches Reddit, Facebook, and YouTube to uncover customer pain points, desired benefits, and your key differentiators — so your ads not only look beautiful but also convert!",
  },
  {
    number: "03",
    title: "Create high-converting ads",
    description: "Turn real customer insights into a set of high-performing static ads — crafted using proven creative strategies that consistently drive conversions",
  },
  {
    number: "04",
    title: "Edit & customize",
    description: "Edit created ads - no design skills required. Pick the ones you like, and Blumpo will generate new variations for you.",
  },
  {
    number: "05",
    title: "Download & publish",
    description: "Launch 10x more content across platforms, 70% faster.",
  },
];

export function HowItWorksSection() {
  return (
    <div className="mt-9 flex flex-col gap-9 md:gap-16">
      {steps.map((step, index) => (
        <div
          key={index}
        >
          {/* Content area */}
          <div className="flex gap-[26px] w-full md:w-auto md:flex-1  relative">
            {/* Left: Number and long gradient line */}
            <div className="flex flex-col items-center relative w-[78px] shrink-0 self-stretch">
              {/* Number */}
              <p className="text-[30px] font-bold text-[#0a0a0a] w-[78px] shrink-0 leading-[50px] text-center">
                {step.number}
              </p>
              {/* Long vertical line with gradient - directly below number, extends down */}
              {step.number !== "05" && (
                <div
                  aria-hidden="true"
                  className={cn(
                    "absolute bottom-0 left-1/2 top-[50px] w-[3px] -translate-x-1/2",
                    index % 2 === 0 ? "bg-gradient-to-b" : "bg-gradient-to-t",
                    "from-brand-secondary via-brand-tertiary to-brand-primary"
                  )}
                />
              )}
            </div>

            {/* Right: Title, description, and image */}
            <div className="flex flex-col md:flex-row items-start gap-4 md:gap-[66px]  w-full">
              {/* Left side: Title and description */}
              <div className="flex flex-col items-start flex-1">
                {/* Title */}
                <p className="text-[30px] font-bold text-[#0a0a0a] leading-[50px]">
                  {step.title}
                </p>

                {/* Description */}
                <div className="w-full md:w-fill py-0">
                  <p
                    className="text-[16px] md:text-[20px] font-normal leading-[30px] text-[#4A5565]"
                  >
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Right side: Image placeholder - aligned to top with title */}
              <div className="bg-[#c8c8c8] h-[200px] md:h-[249px] rounded-[20px] w-full md:w-auto md:flex-1 md:max-w-[450px] self-start" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

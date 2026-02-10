"use client";

import { cn } from "@/lib/utils";

interface Step {
  number: string;
  title: string;
  description: string;
  asset: string; // path relative to /public/images/landing/how-it-works
}

const steps: Step[] = [
  {
    number: "01",
    title: "Input your URL",
    description: "Paste your website link, and Blumpo will automatically scan your site to gather your brand assets including logo, typography, and colors.",
    asset: "animated-input.mp4",
  },
  {
    number: "02",
    title: "Market research",
    description: "Blumpo AI researches Reddit, Facebook, and YouTube to uncover customer pain points, desired benefits, and your key differentiators - so your ads not only look beautiful but also convert!",
    asset: "jetpack-bg.webm",
  },
  {
    number: "03",
    title: "Create high-converting ads",
    description: "Turn real customer insights into high-performing static ads - pick the ones you like, and let the AI engine learn your preferences.",
    asset: "tinder-swipe.mov",
  },
  {
    number: "04",
    title: "Download & publish",
    description: "Launch 10x more content across platforms, 70% faster.",
    asset: "content-gallery.mov",
  },
];

const basePath = "/images/landing/how-it-works";

function StepAsset({ asset, objectFit = "cover" }: { asset: string; objectFit?: "cover" | "contain" }) {
  const isVideo = asset.endsWith(".mov") || asset.endsWith(".mp4") || asset.endsWith(".webm");
  const src = `${basePath}/${asset}`;
  const fitClass = objectFit === "contain" ? "object-contain" : "object-cover";

  if (isVideo) {
    return (
      <video
        src={src}
        autoPlay
        loop
        muted
        playsInline
        className={cn("h-full w-full rounded-[18px]", fitClass)}
      />
    );
  }

  return (
    <img
      src={src}
      alt=""
      className={cn("h-full w-full rounded-[18px]", fitClass)}
    />
  );
}

export function HowItWorksSection() {
  return (
    <div className="mt-9 flex flex-col gap-26 md:gap-36">
      {steps.map((step, index) => (
        <div
          key={index}
          className="relative overflow-visible"
        >
          {/* Content area */}
          <div className="flex gap-[26px] w-full md:w-auto md:flex-1 relative">
            {/* Left: Number and long gradient line - line extends beyond video height */}
            <div className="flex flex-col items-center relative w-[78px] shrink-0 self-stretch">
              {/* Number */}
              <p className="text-[30px] font-bold text-[#0a0a0a] w-[78px] shrink-0 leading-[50px] text-center">
                {step.number}
              </p>
              {/* Long vertical line with gradient - extends 160px beyond video/asset height */}
              {step.number !== "04" && (
                <div
                  aria-hidden="true"
                  className={cn(
                    "absolute left-1/2 top-[50px] w-[3px] -translate-x-1/2 h-[100%] md:h-[120%]",
                    "from-brand-secondary via-brand-tertiary to-brand-primary",
                    index % 2 === 0 ? "bg-gradient-to-b" : "bg-gradient-to-t"
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

              {/* Right side: Asset - 2px gradient border; step 02: blue bg, animation takes half */}
              <div className="rounded-[20px] p-[2px] gradient-primary w-full md:flex-1 md:max-w-[450px] self-start min-h-0">
                <div
                  className={cn(
                    "aspect-[560/300] rounded-[18px] w-full h-full overflow-hidden min-h-0",
                    step.number === "02" ? "bg-[#6391B9] flex items-center justify-center" : "bg-background"
                  )}
                >
                  {step.number === "02" ? (
                    <div className="w-[100%] h-[100%] flex items-center justify-center min-w-0 min-h-0 rounded-[18px] overflow-hidden">
                      <StepAsset asset={step.asset} objectFit="contain" />
                    </div>
                  ) : (
                    <StepAsset asset={step.asset} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

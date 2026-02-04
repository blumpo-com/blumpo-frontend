"use client";

import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { HeroPhotoWall } from "@/components/hero-photo-wall";
import { UrlInputSection } from "./url-input-section";
import { Button } from "@/components/ui/button";

function BenefitRow({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 ">
      <img src="/assets/icons/verified.svg" alt="Verified" className=" w-4 h-4 lg:w-4.5 lg:h-4.5 flex-shrink-0" />
      <span className="text-sm lg:text-base text-black">{text}</span>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="py-10 md:pt-16 md:pb-14 relative z-10 scroll-mt-100">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex justify-between flex-col lg:flex-row  items-center lg:items-start">
          <div className="text-center md:max-w-2xl lg:col-span-6 lg:text-left relative z-10 lg:mr-10 flex flex-col items-center lg:items-start">
            {/* Mobile: Images above headline */}
            <div className="lg:hidden relative w-full flex justify-center items-center mb-6">
              <div className="relative">
                <Image
                  src="/images/temp/half-img.png"
                  alt="Half image"
                  width={260}
                  height={200}
                  className="relative z-10"
                />
                <Image
                  src="/images/temp/blumpo-ladder.png"
                  alt="Blumpo with ladder"
                  width={180}
                  height={250}
                  className="absolute animate-float-up-down z-20 top-4 -right-15"
                />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl md:text-6xl xl:text-7xl text-center lg:text-left">
              Create AI B2B
              <span className="block gradient-secondary bg-clip-text text-transparent">
                ads that win
              </span>
            </h1>
            <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-2xl text-center lg:text-left">
              Blumpo turns customer insights from Reddit,<br></br>
              YT, and your website into $500+ worth ads.<br></br>
            </p>
            <p className="mt-5 text-base font-bold sm:mt-14 sm:text-xl lg:text-lg xl:text-xl">
              Start for free now and create ads in 90s.
            </p>

            {/* Desktop: URL input */}
            <div className="hidden lg:block lg:relative w-160 my-2">
              <Image
                src="/assets/animations/pointing-blumpo.webp"
                alt="Pointing Blumpo"
                width={210}
                height={140}
                className="absolute -top-40 right-2 z-10"
                style={{ clipPath: 'inset(0 40px 0 40px)' }}
                unoptimized
              />
              <Suspense fallback={<div className="mt-5">Loading...</div>}>
                <UrlInputSection />
              </Suspense>
              {/* Benefits list */}

            </div>
            <p className="text-base font-bold sm:text-xl lg:text-lg xl:text-xl">
              Yes, it is that simple.
            </p>
            {/* Mobile: Button instead of URL input */}
            <div className="flex flex-col items-center lg:hidden mt-5">
                <Button asChild variant="cta">
                  <Link href="/sign-in?redirect=input-url" className="flex items-center gap-2">
                    Make your first free Ad
                    <ArrowRight className="w-6 h-6" />
                  </Link>
                </Button>
                {/* Benefits list */}
            </div>

            <div className="flex flex-col gap-3 mt-5 w-fit justify-center items-start">
              <BenefitRow text="No credit card required" />
              <BenefitRow text="300+ happy customers" />
              <BenefitRow text="Start with just a URL" />
            </div>
          </div>
          <HeroPhotoWall />
        </div>
      </div>
    </section>
  );
}


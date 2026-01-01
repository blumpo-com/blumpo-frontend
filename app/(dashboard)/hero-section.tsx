"use client";

import { Suspense } from "react";
import { HeroPhotoWall } from "@/components/hero-photo-wall";
import { UrlInputSection } from "./url-input-section";

export function HeroSection() {
  return (
    <section className="py-10 md:py-20 relative z-10">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="lg:flex justify-between">
          <div className="sm:text-center md:max-w-2xl lg:col-span-6 lg:text-left relative z-10">
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl md:text-6xl">
              Create AI B2B SaaS
              <span className="block gradient-secondary bg-clip-text text-transparent">
                ads that win
              </span>
            </h1>
            <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
              Blumpo turns customer insights from Reddit,<br></br>
              YT, and your website into +$500 worth ads.<br></br>
              No credit card.
            </p>
            <Suspense fallback={<div className="mt-5">Loading...</div>}>
              <UrlInputSection />
            </Suspense>
          </div>
          <HeroPhotoWall />
        </div>
      </div>
    </section>
  );
}


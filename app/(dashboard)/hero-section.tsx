"use client";

import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HeroPhotoWall } from "@/components/hero-photo-wall";
import { UrlInputSection } from "./url-input-section";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="py-10 md:py-20 relative z-10">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex justify-between flex-col lg:flex-row  items-center lg:items-start">
          <div className="text-center md:max-w-2xl lg:col-span-6 lg:text-left relative z-10">
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl md:text-6xl text-center lg:text-left">
              Create AI B2B SaaS
              <span className="block gradient-secondary bg-clip-text text-transparent">
                ads that win
              </span>
            </h1>
            <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl text-center lg:text-left">
              Blumpo turns customer insights from Reddit,<br></br>
              YT, and your website into +$500 worth ads.<br></br>
              No credit card needed.
            </p>
            <p className="mt-5 text-base font-bold sm:mt-10 sm:text-xl lg:text-lg xl:text-xl">
                Start for free now and create ads in 30s.
              </p>
            {/* Mobile: Button instead of URL input */}
              <div className="flex items-center justify-center lg:hidden my-2">
                <Button asChild variant="cta">
                  <Link href="/dashboard" className="flex items-center gap-2">
                    Make your first free Ad
                    <ArrowRight className="w-6 h-6" />
                  </Link>
                </Button>
              </div>
            {/* Desktop: URL input */}
            <div className="hidden lg:block">
              <Suspense fallback={<div className="mt-5">Loading...</div>}>
                <UrlInputSection />
              </Suspense>
            </div>
            <p className="text-base font-bold
             sm:text-xl lg:text-lg xl:text-xl">
                Yes, it is that simple.
            </p>
          </div>
          <HeroPhotoWall />
        </div>
      </div>
    </section>
  );
}


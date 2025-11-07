import { Button } from "@/components/ui/button";
import { ArrowRight, CreditCard, Database } from "lucide-react";
import { Terminal } from "./terminal";
import { UrlInputSection } from "./url-input-section";
import { HeroPhotoWall } from "@/components/hero-photo-wall";
import { ContentProofSection } from "./content-proof-section";
import { PricingSection } from "./pricing-section";

export default function HomePage() {
  return (
    <main>
      <section className="py-10 md:py-20">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:flex justify-between">
            <div className="sm:text-center md:max-w-2xl lg:col-span-6 lg:text-left">
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
              <UrlInputSection />
            </div>
            <HeroPhotoWall />
          </div>
        </div>
      </section>

      <section className="py-16  w-full h-8xl">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="header-gradient">
            You've probably seen our work.<br></br>
            You just didn't know it was AI.
          </h1>
          <ContentProofSection />
        </div>
      </section>

      <section className="py-16  w-full">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="header-gradient">
            Pick a plan or start creating for free.
          </h1>
          <PricingSection />
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"></div>
      </section>
    </main>
  );
}

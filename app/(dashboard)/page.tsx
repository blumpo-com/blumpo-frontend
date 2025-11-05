import { Button } from "@/components/ui/button";
import { ArrowRight, CreditCard, Database } from "lucide-react";
import { Terminal } from "./terminal";
import { UrlInputSection } from "./url-input-section";
import { HeroPhotoWall } from "@/components/hero-photo-wall";
import { ContentProofSection } from "./content-proof-section";

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

      <section className="py-16  w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="header-gradient">
            You have probably seen our work.<br></br>
            You just didn't know it was AI.
          </h1>
          <ContentProofSection />
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Ready to launch your SaaS?
              </h2>
              <p className="mt-3 max-w-3xl text-lg text-gray-500">
                Our template provides everything you need to get your SaaS up
                and running quickly. Don't waste time on boilerplate - focus on
                what makes your product unique.
              </p>
            </div>
            <div className="mt-8 lg:mt-0 flex justify-center lg:justify-end">
              <a href="https://github.com/nextjs/saas-starter" target="_blank">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg rounded-full"
                >
                  View the code
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

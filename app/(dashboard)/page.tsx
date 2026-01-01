import { Button } from "@/components/ui/button";
import { ArrowRight, CreditCard, Database } from "lucide-react";
import { Terminal } from "./terminal";
import { HeroSection } from "./hero-section";
import { ContentProofSection } from "./content-proof-section";
import { PricingSection } from "./pricing-section";
import { OAuthRedirectHandler } from "./oauth-redirect-handler";
import { Suspense } from "react";
import { HowItWorksSection } from "./how-it-works-section";
import { FitYourBrandSection } from "./fit-your-brand-section";
import { ComparisonSection } from "./comparison-section";
import { TestimonialSection } from "./testimonial-section";
import { FaqSection } from "./faq-section";

function HeaderSection({ title, children }: { title: React.ReactNode, children: React.ReactNode }) {
  return (
    <section className="py-16  w-full">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="header-gradient">
            {title}
          </h1>
          {children}
        </div>
      </section>
  );
}

export default function HomePage() {
  return (
    <>
      <Suspense fallback={null}>
        <OAuthRedirectHandler />
      </Suspense>
    <main className="relative">
      {/* Colored circular shadows on the left - positioned relative to main to be visible under header */}
      <div className="absolute left-[-310px] top-[400px] w-[687px] h-[654px] pointer-events-none z-0 ">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-secondary/30 via-brand-tertiary/20 to-transparent rounded-full blur-[100px]" />
      </div>
      <div className="absolute left-[-329px] top-[-100px] w-[629px] h-[620px] pointer-events-none z-0 ">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-secondary/25 via-brand-tertiary/15 to-transparent rounded-full blur-[100px]" />
      </div>
      
      <HeroSection />

      <HeaderSection 
        title={<>You've probably seen our work.<br />You just didn't know it was AI.</>}>
        <ContentProofSection />
      </HeaderSection>


        <HeaderSection 
          title="How does our AI marketing solution works?">
          <HowItWorksSection />
        </HeaderSection>

      <HeaderSection 
        title={<>We listened to your customers.<br />We understand your style.</>}>
        <FitYourBrandSection />
      </HeaderSection>

      <HeaderSection 
        title="One tool to do it all.">
        <ComparisonSection />
      </HeaderSection>

      <HeaderSection 
        title="Pick a plan or start creating for free.">
        <PricingSection />
      </HeaderSection>

      <HeaderSection 
        title="Here from our customers.">
        <TestimonialSection />
      </HeaderSection>

      <HeaderSection 
        title="Answers you’re loooking for.">
        <FaqSection />
      </HeaderSection>
    </main>
    </>
  );
}

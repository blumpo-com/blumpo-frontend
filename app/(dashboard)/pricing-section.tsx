"use client";

import {
  PrimaryPricingCard,
  SecondaryPricingCard,
} from "@/components/ui/pricing-card";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <div className="mt-12 max-w-6xl mx-auto">
      {/* Switch toggle */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <button
          onClick={() => setIsAnnual(!isAnnual)}
          className={cn(
            "flex items-center gap-3 transition-colors",
            isAnnual ? "text-gray-500" : "text-gray-900"
          )}
        >
          <div
            className={cn(
              "relative w-12 h-6 rounded-full transition-colors cursor-pointer",
              isAnnual ? "bg-gray-900" : "bg-gray-400"
            )}
          >
            <div
              className={cn(
                "absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full transition-all duration-200",
                isAnnual ? "left-7" : "left-1"
              )}
            />
          </div>
          <span
            className={cn(
              "text-base font-semibold",
              isAnnual ? "text-gray-500" : "text-gray-900"
            )}
          >
            Save 50% on annual plan
          </span>
        </button>
      </div>

      {/* Pricing cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:h-140">
        <SecondaryPricingCard
          name="Starter"
          price={isAnnual ? 17 : 34}
          interval={isAnnual ? "/year" : "/month"}
          description="For individual creators"
          features={[
            "50 ads created per month",
            "Ads creation in 10+ archetypes",
            "Various sizes and formats (1:1, 9:16)",
            "1 brand",
          ]}
        />
        <PrimaryPricingCard
          name="Growth"
          price={isAnnual ? 39 : 79}
          description="For small businesses and marketers"
          features={[
            "150 ads created per month",
            "Ads creation in 10+ archetypes",
            "Various sizes and formats (1:1, 9:16)",
            "Customer & competitor insight access",
            "Up to 3 brands",
          ]}
        />
        <SecondaryPricingCard
          name="Team Plan"
          price={isAnnual ? 199 : 399}
          description="Ideal for medium size agencies and marketing teams"
          features={[
            "2000 ads created per month",
            "Ads creation in 10+ archetypes",
            "Various sizes and formats (1:1, 9:16)",
            "Customer & competitor insight access",
            "Unlimited number of brands",
            "Up to 5 users",
          ]}
        />
      </div>
    </div>
  );
}

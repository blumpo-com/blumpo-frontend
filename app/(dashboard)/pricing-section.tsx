"use client";

import {
  PrimaryPricingCard,
  SecondaryPricingCard,
} from "@/components/ui/pricing-card";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check, Zap, Star, Users, Briefcase } from "lucide-react";

interface PricingCardProps {
  name: string;
  icon: "bolt" | "star" | "team" | "enterprise";
  price: number | null;
  credits: string | null;
  description: string;
  features: string[];
  buttonText: string;
  isPopular?: boolean;
}

function PricingCard({
  name,
  icon,
  price,
  credits,
  description,
  features,
  buttonText,
  isPopular = false,
}: PricingCardProps) {
  const iconMap = {
    bolt: Zap,
    star: Star,
    team: Users,
    enterprise: Briefcase,
  };

  const IconComponent = iconMap[icon];
  const cardHeight = isPopular ? "h-[600px] min-[1301px]:h-[660px]" : "h-[600px] min-[1301px]:h-[620px]";
  const shadow = isPopular
    ? "shadow-[0px_0px_7px_3px_rgba(0,0,0,0.15)]"
    : "shadow-[0px_0px_7px_3px_rgba(0,0,0,0.05)]";

  // Card content component - shared between popular and regular cards
  const cardContent = (
    <div
      className={cn(
        "bg-white flex flex-col gap-[10px] items-start overflow-clip relative h-full",
        // Border radius - different for popular (18px) vs regular (20px)
        isPopular ? "rounded-[18px]" : "rounded-[20px]",
        // Mobile sizes
        "pb-5 px-[18px] w-full",
        // Desktop sizes (above 1300px)
        "min-[1301px]:pb-5 min-[1301px]:px-[15px]",
        // Padding top - different for popular
        isPopular ? "pt-[60px] min-[1301px]:pt-[73px]" : "pt-[29px]",
        shadow
      )}
    >
      {/* Most Popular banner - only for popular cards */}
      {isPopular && (
        <div
          className="absolute left-0 top-0 w-full min-[1301px]:w-[313px] flex flex-col items-center justify-center py-[10px] overflow-clip gradient-primary"
        >
          <span className="text-base font-normal text-[#f9fafb] leading-[24px]">
            Most Popular
          </span>
        </div>
      )}

      {/* Icon and Title */}
      <div className="flex gap-[10px] items-center w-full">
        <div className="bg-[#00bfa6] p-3 rounded-[8px] size-[38px] flex items-center justify-center">
          <IconComponent className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-[22px] font-bold text-[#0a0a0a] leading-normal">
          {name}
        </h2>
      </div>

      {/* Description */}
      <p className="text-base font-normal text-[#888e98] leading-normal w-full">
        {description}
      </p>

      {/* Spacer */}
      <div className="h-[14px] w-full" />

      {/* Price */}
      {price !== null ? (
        <div className="flex gap-[10px] items-center w-full">
          <span className="text-[38px] font-bold text-[#00bfa6]">${price}</span>
          <span className="text-[24px] font-semibold text-[#0a0a0a]">/month</span>
        </div>
      ) : (
        <div className="h-[88px] w-full" />
      )}

      {/* Credits */}
      {credits && (
        <p className="text-base font-semibold text-[#0a0a0a] leading-normal">
          {credits}
        </p>
      )}

      {/* Spacer */}
      {price !== null && <div className="h-[14px] w-full" />}

      {/* Button */}
      <button className="bg-[#0a0a0a] h-[45px] flex items-center justify-center rounded-[8px] w-full">
        <span className="text-[22px] font-bold text-[#f9fafb] leading-normal">
          {buttonText}
        </span>
      </button>

      {/* Separator */}
      <div className="bg-[#d9d9d9] h-px w-full" />

      {/* Spacer */}
      <div className="h-[14px] w-full" />

      {/* Features */}
      <div className="flex flex-col gap-[14px] items-start w-full">
        {features.map((feature, index) => (
          <div key={index} className="flex gap-[10px] items-center w-full">
            <div className="size-5 flex-shrink-0">
              <div className="size-5 rounded-full bg-[#00bfa6] flex items-center justify-center">
                <Check className="w-3 h-3 text-white" strokeWidth={3} />
              </div>
            </div>
            <span className="text-base font-normal text-[#888e98] leading-normal whitespace-pre-line">
              {feature}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  // Popular cards use gradient border wrapper
  if (isPopular) {
    return (
      <div
        className={cn(
          "rounded-[20px] p-[2px] gradient-primary",
          // Mobile sizes
          "w-full",
          // Desktop sizes (above 1300px)
          "min-[1301px]:w-[309px] min-[1301px]:shrink-0",
          cardHeight
        )}
      >
        {cardContent}
      </div>
    );
  }

  // Regular cards without gradient border
  return (
    <div
      className={cn(
        "border-2 border-solid border-[#d8d8db] rounded-[20px]",
        // Mobile sizes
        "w-full",
        // Desktop sizes (above 1300px)
        "min-[1301px]:w-[309px] min-[1301px]:shrink-0",
        cardHeight
      )}
    >
      {cardContent}
    </div>
  );
}

const mobilePlans: Array<{
  id: string;
  name: string;
  icon: "bolt" | "star" | "team" | "enterprise";
  price: { monthly: number; annual: number } | null;
  credits: string | null;
  description: string;
  features: string[];
}> = [
  {
    id: "starter",
    name: "Starter",
    icon: "bolt",
    price: { monthly: 34, annual: 17 },
    credits: "500 credits (50 ads) / month",
    description: "For individual creators",
    features: [
      "Ads creation in 10+ archetypes",
      "Various sizes and formats\n(1:1, 9:16)",
      "1 Brand",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    icon: "star",
    price: { monthly: 79, annual: 39 },
    credits: "1500 credits (150 ads) / month",
    description: "For small businesses and marketers",
    features: [
      "Ads creation in 10+ archetypes",
      "Various sizes and formats\n(1:1, 9:16)",
      "Customer & competitor insight\naccess",
      "Up to 3 brands",
    ],
  },
  {
    id: "team",
    name: "Team Plan",
    icon: "team",
    price: { monthly: 399, annual: 199 },
    credits: "20,000 credits (2000 ads) / month",
    description: "Ideal for medium size agencies and marketing teams",
    features: [
      "Ads creation in 10+ archetypes",
      "Various sizes and formats\n(1:1, 9:16)",
      "Customer & competitor insight\naccess",
      "Unlimited number of brands",
      "Up to 5 users",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    icon: "enterprise",
    price: null,
    credits: null,
    description: "For big agencies and internal marketing teams - custom integrations",
    features: [
      "Everything from Team plan",
      "10+ users",
      "Custom integrations",
    ],
  },
];


export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState("starter");

  const currentPlan = mobilePlans.find((p) => p.id === selectedPlan)!;
  const currentPrice = currentPlan.price
    ? isAnnual
      ? currentPlan.price.annual
      : currentPlan.price.monthly
    : null;

  return (
    <div className="mt-12 max-w-xl mx-auto ">
      {/* Switch toggle */}
      <div className="flex items-center justify-center gap-[30px] mb-8">
        <button
          onClick={() => setIsAnnual(!isAnnual)}
          className="flex items-center gap-[30px] transition-colors"
        >
          {/* Toggle switch - responsive */}
          <div
            className={cn(
              "flex items-center overflow-hidden relative transition-colors duration-200",
              // Mobile sizes - proporcjonalnie mniejsze niż desktop
              "p-1 rounded-[6px] w-[37px] h-[23px]",
              // Desktop sizes (above 1300px)
              "min-[1301px]:p-1 min-[1301px]:rounded-[9px] min-[1301px]:w-[53px] min-[1301px]:h-[33px]",
              isAnnual ? "bg-[#0a0a0a]" : "bg-gray-400"
            )}
          >
            <div
              className={cn(
                "bg-[#f9fafb] transition-all duration-200 absolute",
                // Mobile sizes - proporcjonalnie mniejsze
                "h-[15px] rounded-[4px] w-[17px]",
                isAnnual ? "left-[17px]" : "left-1",
                // Desktop sizes (above 1300px)
                "min-[1301px]:h-[22px] min-[1301px]:rounded-[5px] min-[1301px]:w-[24px]",
                isAnnual ? "min-[1301px]:left-[24px]" : "min-[1301px]:left-[5px]"
              )}
            />
          </div>
          <span className="text-[23px] font-bold text-[#0a0a0a] hidden min-[1301px]:block">
            Save 50% on annual plan
          </span>
          <span className="text-[16px] font-bold text-[#0a0a0a] max-[1300px]:block min-[1301px]:hidden">
            Save 50% on annual plan
          </span>
        </button>
      </div>

      {/* Mobile: Tabs navigation */}
      <div className="max-[1300px]:flex min-[1301px]:hidden gap-[7px] mb-5 px-0 py-[27px] justify-center overflow-clip">
        {mobilePlans.map((plan) => (
          <button
            key={plan.id}
            onClick={() => setSelectedPlan(plan.id)}
            className={cn(
              "flex-1 h-[50px] flex items-center justify-center rounded-[10px] py-[10px] transition-all w-[25%] cursor-pointer",
              selectedPlan === plan.id
                ? "bg-[#00bfa6] border border-[#00bfa6] text-[#f9fafb]"
                : "bg-white border border-[#0a0a0a] text-[#0a0a0a]"
            )}
          >
            <span className="text-sm font-semibold">{plan.name}</span>
          </button>
        ))}
      </div>

      {/* Mobile: Single card view */}
      <div className="max-[1300px]:block min-[1301px]:hidden">
        <PricingCard
          name={currentPlan.name}
          icon={currentPlan.icon}
          price={currentPrice}
          credits={currentPlan.credits}
          description={currentPlan.description}
          features={currentPlan.features}
          buttonText={currentPlan.id === "enterprise" ? "Let's talk" : "Select plan"}
          isPopular={currentPlan.id === "growth"}
        />
      </div>

      {/* Desktop: Pricing cards - 4 cards in a row */}
      <div className="hidden min-[1301px]:flex gap-[28px] justify-center items-end px-0 py-[25px]">
        {/* Starter */}
        <PricingCard
          name="Starter"
          icon="bolt"
          price={isAnnual ? 17 : 34}
          credits={isAnnual ? "500 credits (50 ads) / month" : "500 credits (50 ads) / month"}
          description="For individual creators"
          features={[
            "Ads creation in 10+ archetypes",
            "Various sizes and formats\n(1:1, 9:16)",
            "1 Brand",
          ]}
          buttonText="Select plan"
        />
        
        {/* Growth - Most Popular */}
        <PricingCard
          name="Growth"
          icon="star"
          price={isAnnual ? 39 : 79}
          credits={isAnnual ? "1500 credits (150 ads) / month" : "1500 credits (150 ads) / month"}
          description="For small businesses and marketers"
          features={[
            "Ads creation in 10+ archetypes",
            "Various sizes and formats\n(1:1, 9:16)",
            "Customer & competitor insight\naccess",
            "Up to 3 brands",
          ]}
          buttonText="Select plan"
          isPopular={true}
        />
        
        {/* Team Plan */}
        <PricingCard
          name="Team Plan"
          icon="team"
          price={isAnnual ? 199 : 399}
          credits={isAnnual ? "20,000 credits (2000 ads) / month" : "20,000 credits (2000 ads) / month"}
          description="Ideal for medium size agencies and marketing teams"
          features={[
            "Ads creation in 10+ archetypes",
            "Various sizes and formats\n(1:1, 9:16)",
            "Customer & competitor insight\naccess",
            "Unlimited number of brands",
            "Up to 5 users",
          ]}
          buttonText="Select plan"
        />
        
        {/* Enterprise */}
        <PricingCard
          name="Enterprise"
          icon="enterprise"
          price={null}
          credits={null}
          description="For big agencies and internal marketing teams - custom integrations"
          features={[
            "Everything from Team plan",
            "10+ users",
            "Custom integrations",
          ]}
          buttonText="Let's talk"
        />
      </div>
    </div>
  );
}

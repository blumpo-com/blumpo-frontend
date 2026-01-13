"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { useAnimatedNumber } from "@/lib/hooks/use-animated-number";

interface PricingCardProps {
  name: string;
  icon: "bolt" | "star" | "team" | "enterprise";
  price: number | null;
  credits: string | null;
  description: string;
  features: string[];
  buttonText: string;
  isPopular?: boolean;
  isCurrentPlan?: boolean;
  checkoutAction?: (formData: FormData) => Promise<void>;
  planId?: string;
  planCode?: string | null;
  monthlyPriceId?: string | null;
  annualPriceId?: string | null;
  isAnnual?: boolean;
  allowCheckoutWithoutPriceId?: boolean;
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
  isCurrentPlan = false,
  checkoutAction,
  planId,
  planCode,
  monthlyPriceId,
  annualPriceId,
  isAnnual = true,
  allowCheckoutWithoutPriceId = false,
}: PricingCardProps) {
  const iconMap = {
    bolt: '/assets/icons/bolt.svg',
    star: '/assets/icons/star.svg',
    team: '/assets/icons/people.svg',
    enterprise: '/assets/icons/briefcase.svg',
  };

  const IconComponent = iconMap[icon as keyof typeof iconMap];
  const cardHeight = isPopular ? "h-160 min-[1301px]:h-165" : "h-160 min-[1301px]:h-155";
  const shadow = isPopular
    ? "shadow-[0px_0px_7px_3px_rgba(0,0,0,0.15)]"
    : "shadow-[0px_0px_7px_3px_rgba(0,0,0,0.05)]";

  // Animate price changes
  const animatedPrice = useAnimatedNumber({ target: price });

  // Get the appropriate price ID based on annual/monthly
  const priceId = isAnnual ? annualPriceId : monthlyPriceId;
  const canCheckout = checkoutAction && (priceId || (allowCheckoutWithoutPriceId && planCode)) && !isCurrentPlan && buttonText !== "Let's talk";

  // Card content component - shared between popular and regular cards
  const cardContent = (
    <div
      className={cn(
        "bg-white flex flex-col gap-[10px] items-start overflow-clip relative h-full",
        isPopular ? "rounded-[18px]" : "rounded-[20px]",
        "pb-5 px-[18px] w-full",
        "min-[1301px]:pb-5 min-[1301px]:px-[15px]",
        isPopular ? "pt-18" : "pt-8",
        shadow
      )}
    >
      {isPopular && (
        <div className="absolute left-0 top-0 w-full flex flex-col items-center justify-center py-[10px] overflow-clip gradient-primary h-11">
          <span className="text-base font-normal text-[#f9fafb] leading-[24px]">
            Most Popular
          </span>
        </div>
      )}

      <div className="flex gap-[10px] items-center w-full">
        <div className="bg-[#00bfa6] p-2 rounded-[8px] size-[38px] flex items-center justify-center">
          <img src={IconComponent} alt={name} className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-[22px] font-bold text-[#0a0a0a] leading-normal">
          {name}
        </h2>
      </div>

      <p className="text-base font-normal text-[#888e98] leading-normal w-full h-16 mb-4">
        {description}
      </p>
      <div className="h-17">
        {animatedPrice !== null ? (
          <div className="flex gap-[10px] items-center w-full">
            <span className="text-[38px] font-bold text-[#00bfa6]">${animatedPrice}</span>
            <span className="text-[24px] font-semibold text-[#0a0a0a]">/month</span>
          </div>
        ) : (
          <div className="h-17" />
        )}

        {credits && (
          <p className="text-base font-semibold text-[#0a0a0a] leading-normal">
            {credits}
          </p>
        )}
      </div>

      {isCurrentPlan ? (
        <button 
          disabled
          className="bg-[#0a0a0a] h-[45px] flex items-center justify-center gap-2 rounded-[8px] w-full my-4 cursor-not-allowed"
        >
          <img src="/assets/icons/Check_2.svg" alt="Current Plan" className="w-5 h-5" />
          <span className="text-[22px] font-bold text-[#f9fafb] leading-normal">
            Current plan
          </span>
        </button>
      ) : canCheckout ? (
        <form action={checkoutAction} className="w-full flex items-center justify-center">
          <input type="hidden" name="priceId" value={priceId || ""} className="hidden" />
          {planCode && <input type="hidden" name="planCode" value={planCode} className="hidden" />}
          <input type="hidden" name="interval" value={isAnnual ? "annual" : "monthly"} className="hidden" />
          <button 
            type="submit"
            className="bg-[#0a0a0a] h-[45px] flex items-center justify-center rounded-[8px] w-full my-4 cursor-pointer hover:bg-[#0a0a0a]/90"
          >
            <span className="text-[22px] font-bold text-[#f9fafb] leading-normal">
              {buttonText}
            </span>
          </button>
        </form>
      ) : buttonText === "Let's talk" ? (
        <button 
          className="bg-[#0a0a0a] h-[45px] flex items-center justify-center rounded-[8px] w-full my-4 cursor-pointer hover:bg-[#0a0a0a]/90"
          onClick={() => {
            console.log('Enterprise contact requested');
          }}
        >
          <span className="text-[22px] font-bold text-[#f9fafb] leading-normal">
            {buttonText}
          </span>
        </button>
      ) : (
        <button 
          disabled
          className="bg-gray-300 h-[45px] flex items-center justify-center rounded-[8px] w-full my-4 cursor-not-allowed"
        >
          <span className="text-[22px] font-bold text-gray-500 leading-normal">
            {buttonText}
          </span>
        </button>
      )}

      <div className="bg-[#d9d9d9] h-px w-full mb-4" />

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

  if (isPopular) {
    return (
      <div className={cn("rounded-[20px] p-[2px] gradient-primary pricing-card-hover", "w-full", cardHeight)}>
        {cardContent}
      </div>
    );
  }

  return (
    <div className={cn("border-2 border-solid border-[#d8d8db] rounded-[20px] pricing-card-hover pricing-card-hover-border", "w-full", cardHeight)}>
      {cardContent}
    </div>
  );
}

const subscriptionPlans: Array<{
  id: string;
  name: string;
  icon: "bolt" | "star" | "team" | "enterprise";
  price: { monthly: number; annual: number } | null;
  credits: string | null;
  description: string;
  features: string[];
  planCode?: string;
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
    planCode: "STARTER",
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
    planCode: "GROWTH",
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
    planCode: "TEAM",
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

interface PricingSectionProps {
  checkoutAction?: (formData: FormData) => Promise<void>;
  currentPlanCode?: string;
  showEnterprise?: boolean;
  planPrices?: Record<string, { monthly: string | null; annual: string | null }>;
  allowCheckoutWithoutPriceId?: boolean;
}

export function PricingSection({ 
  checkoutAction,
  currentPlanCode,
  showEnterprise = false,
  planPrices = {},
  allowCheckoutWithoutPriceId = false,
}: PricingSectionProps = {}) { 
  const [isAnnual, setIsAnnual] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState("starter");

  const displayPlans = showEnterprise 
    ? subscriptionPlans 
    : subscriptionPlans.filter(p => p.id !== "enterprise");

  const currentPlan = displayPlans.find((p) => p.id === selectedPlan) || displayPlans[0];
  const currentPrice = currentPlan.price
    ? isAnnual
      ? currentPlan.price.annual
      : currentPlan.price.monthly
    : null;

  return (
    <div className="mt-12 max-w-xl min-[1301px]:max-w-full mx-auto ">
      <div className="flex items-center justify-center gap-[30px] mb-8">
        <button
          onClick={() => setIsAnnual(!isAnnual)}
          className="cursor-pointer"
        >
          <div
            className={cn(
              "flex items-center overflow-hidden relative transition-colors duration-200",
              "p-1 rounded-[6px] w-[37px] h-[23px]",
              isAnnual ? "bg-[#0a0a0a]" : "bg-gray-400"
            )}
          >
            <div
              className={cn(
                "bg-[#f9fafb] transition-all duration-200 absolute",
                "h-[15px] rounded-[4px] w-[17px]",
                isAnnual ? "left-[17px]" : "left-1",
              )}
            />
          </div>
        </button>
        <span className="text-[16px] font-bold text-[#0a0a0a]">
          Save 50% on annual plan
        </span>
      </div>

      <div className="max-[1300px]:flex min-[1301px]:hidden gap-[7px] mb-5 px-0 py-[27px] justify-center overflow-clip">
        {displayPlans.map((plan) => (
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

      <div className="max-[1300px]:block min-[1301px]:hidden">
        <PricingCard
          name={currentPlan.name}
          icon={currentPlan.icon}
          price={currentPrice}
          credits={currentPlan.credits}
          description={currentPlan.description}
          features={currentPlan.features}
          buttonText={currentPlan.id === "enterprise" ? "Let's talk" : (currentPlanCode && currentPlan.planCode === currentPlanCode ? "Current plan" : "Select plan")}
          isPopular={currentPlan.id === "growth"}
          isCurrentPlan={currentPlanCode ? currentPlan.planCode === currentPlanCode : false}
          checkoutAction={checkoutAction}
          planId={currentPlan.id}
          planCode={currentPlan.planCode || null}
          monthlyPriceId={currentPlan.planCode ? planPrices[currentPlan.planCode]?.monthly || null : null}
          annualPriceId={currentPlan.planCode ? planPrices[currentPlan.planCode]?.annual || null : null}
          isAnnual={isAnnual}
          allowCheckoutWithoutPriceId={allowCheckoutWithoutPriceId}
        />
      </div>

      <div className="hidden min-[1301px]:flex justify-between items-end px-0 gap-5">
        {displayPlans.map((plan) => {
          const planPriceMap = plan.planCode ? planPrices[plan.planCode] : null;
          const isCurrent = currentPlanCode ? plan.planCode === currentPlanCode : false;
          
          return (
            <PricingCard
              key={plan.id}
              name={plan.name}
              icon={plan.icon}
              price={isAnnual ? plan?.price?.annual || null : plan?.price?.monthly || null}
              credits={plan.credits}
              description={plan.description}
              features={plan.features}
              buttonText={plan.id === "enterprise" ? "Let's talk" : (isCurrent ? "Current plan" : "Select plan")}
              isPopular={plan.id === "growth"}
              isCurrentPlan={isCurrent}
              checkoutAction={checkoutAction}
              planId={plan.id}
              planCode={plan.planCode || null}
              monthlyPriceId={planPriceMap?.monthly || null}
              annualPriceId={planPriceMap?.annual || null}
              isAnnual={isAnnual}
              allowCheckoutWithoutPriceId={allowCheckoutWithoutPriceId}
            />
          );
        })}
      </div>
    </div>
  );
}

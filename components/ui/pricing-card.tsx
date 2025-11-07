import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PricingCardProps {
  name: string;
  price: number;
  interval?: string;
  description?: string;
  features: string[];
  className?: string;
}

// Base PricingCard component
export function PricingCard({
  name,
  price,
  description,
  features,
  className,
}: PricingCardProps) {
  const formattedPrice = typeof price === "number" ? `$${price}` : price;
  // Add space before interval if it doesn't start with one

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-left">
          {name}
        </h2>
        <div className="flex items-baseline mb-2">
          <span className="text-4xl font-bold text-[#00BFA6]">
            {formattedPrice}
          </span>
          <span className="text-2xl font-bold text-gray-900 ml-2">/month</span>
        </div>
        {description && <p className="text-md text-gray-500">{description}</p>}
      </div>
      <div className="border-t border-gray-200 my-4"></div>
      <ul className="space-y-3 flex-1">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-5 w-5 rounded-full bg-[#00BFA6] flex items-center justify-center">
                <Check className="h-3 w-3 text-white" strokeWidth={3} />
              </div>
            </div>
            <span className="text-base font-medium text-gray-500 ml-2">
              {feature}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Secondary PricingCard - simple card with light grey background
export function SecondaryPricingCard({
  name,
  price,
  interval = "/month",
  description,
  features,
  className,
}: PricingCardProps) {
  return (
    <div
      className={cn(
        "bg-gray-50 rounded-2xl shadow-md p-6 border-2 border-gray-200 h-full flex flex-col md:translate-y-10",
        className
      )}
    >
      <PricingCard
        name={name}
        price={price}
        interval={interval}
        description={description}
        features={features}
      />
    </div>
  );
}

// Primary PricingCard - with gradient border and "Most Popular" badge
export function PrimaryPricingCard({
  name,
  price,
  interval = "/month",
  description,
  features,
  className,
  badgeText = "Most Popular",
}: PricingCardProps & { badgeText?: string }) {
  return (
    <div className={cn("relative h-full ", className)}>
      {/* Gradient border wrapper */}
      <div className="bg-gradient-to-r from-brand-secondary via-brand-tertiary to-brand-primary p-[2px] rounded-2xl shadow-xl h-full flex flex-col">
        <div className="bg-white rounded-2xl overflow-hidden relative flex flex-col flex-1">
          {/* Most Popular badge - full width */}
          <div className="bg-gradient-to-r from-brand-secondary via-brand-tertiary to-brand-primary py-3 px-4 flex-shrink-0">
            <span className="text-sm font-medium text-white tracking-wide block text-center">
              {badgeText}
            </span>
          </div>
          {/* White card content */}
          <div className="p-6 flex-1 flex flex-col">
            <PricingCard
              name={name}
              price={price}
              interval={interval}
              description={description}
              features={features}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

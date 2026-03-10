"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";

const FOUNDERS_BASE = "/images/landing/founders";

const founders = [
  {
    name: "Przemek Wojtyla",
    role: "Co-founder, AI Creative Automation",
    image: `${FOUNDERS_BASE}/przemek-t.png`,
    imageLeft: true,
  },
  {
    name: "Dominik Uchnast",
    role: "Co-founder, Marketing & UX",
    image: `${FOUNDERS_BASE}/dominik-t.png`,
    imageLeft: false,
  },
  {
    name: "Franek Zarebski",
    role: "Co-founder, Backend Architect",
    image: `${FOUNDERS_BASE}/franek-t.png`,
    imageLeft: true,
  },
  {
    name: "Kuba Madry",
    role: "Co-founder, Product Architect",
    image: `${FOUNDERS_BASE}/kuba-t.png`,
    imageLeft: false,
  },
];

const founderParagraphs = [
  "We've spent years founding, scaling, and advising SaaS and D2C companies — from San Francisco through Rotterdam, Riyadh to Warsaw.",
  "Along the way, we learned something. Great ads don't start with a five-hour debate over button colors. They start with understanding your customer. And there's a real difference between creative that looks good and creative that actually performs.",
  "We've also learned that scaling marketing operations is still way harder than it should be.",
  "So we've built the solution we always wanted.",
  "So we've built Blumpo - AI ad generator that create ads based on customer insights from Reddit and social media.",
  "Join us on the ride and try Blumpo 💪",
];

export function FounderSection() {
  return (
    <section className="w-full bg-background py-14 md:py-20">
      <div className="mx-auto w-full sm:max-w-3xl lg:max-w-5xl xl:max-w-7xl  px-4 sm:px-6 lg:px-8">
        <div className="flex w-full flex-col gap-8 xl:flex-row xl:items-stretch xl:gap-10">
          {/* Founders: < md 1 col, md–xl 2 per row, xl+ 1 col left */}
          <div className="flex flex-col gap-6 md:grid md:grid-cols-2 xl:flex xl:min-w-0 xl:flex-1">
            {founders.map((founder) => (
              <div
                key={founder.name}
                className={cn(
                  "flex min-h-[120px] items-center overflow-visible rounded-2xl bg-white px-6 py-3 shadow-[0_0_19px_rgba(0,0,0,0.1)]",
                  founder.imageLeft ? "flex-row gap-6" : "flex-row-reverse gap-6"
                )}
              >
                {/* Photo overflows only from the top of the card */}
                <div className="relative h-[110px] w-[110px] md:h-[130px] md:w-[130px] shrink-0 overflow-visible rounded-2xl -mt-10">
                  <Image
                    src={founder.image}
                    alt={founder.name}
                    width={386}
                    height={386}
                    className="size-full rounded-2xl object-cover object-top"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-bold text-foreground">
                    {founder.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{founder.role}</p>
                </div>
              </div>
            ))}
          </div>

          {/* From Founders to Founders box */}
          <div className="flex flex-col gap-6 rounded-2xl bg-white px-6 py-9 shadow-[0_0_19px_rgba(0,0,0,0.1)] xl:min-w-0 xl:flex-1">
            <h2 className="text-2xl font-bold tracking-tight md:text-[28px] bg-gradient-to-r from-brand-secondary to-brand-primary bg-clip-text text-transparent">
              From Founders to Founders
            </h2>
            <div className="flex flex-col gap-5 text-base text-foreground/80">
              {founderParagraphs.map((paragraph, i) => (
                <p key={i} className={i === 4 ? "font-bold" : undefined}>
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

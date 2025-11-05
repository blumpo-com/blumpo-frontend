"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";

const buttons = [
  { id: "blue", label: "Problem-solution", gradient: "gradient-blue" },
  { id: "green", label: "Testimonial", gradient: "gradient-green" },
  { id: "purple", label: "Promotion", gradient: "gradient-purple" },
  { id: "orange", label: "Product demonstration", gradient: "gradient-orange" },
];

export function ContentProofSection() {
  const [activeButton, setActiveButton] = useState(0);

  return (
    <div className="mt-12">
      <div className="flex flex-wrap justify-center gap-4">
        {buttons.map((button, index) => (
          <Button
            key={button.id}
            variant="outline"
            onClick={() => setActiveButton(index)}
            className={cn(
              "px-6",
              "hover:bg-foreground hover:text-background",
              activeButton == index ? "bg-foreground text-background" : ""
            )}
          >
            {button.label}
          </Button>
        ))}
      </div>

      <div
        key={activeButton}
        className={`mt-8 w-full h-100 md:h-146 rounded-2xl ${buttons[activeButton].gradient} animate-fade relative overflow-hidden flex items-center justify-center`}
      >
        {/* Obrazy z rotacją i animacją */}
        <Image
          src="/images/hero/1.png"
          alt="Content proof image"
          width={300}
          height={300}
          className="absolute left-[10%] -rotate-5 animate-float-up-down rounded-lg object-cover shadow-lg"
          style={{ animationDelay: "0s" }}
        />
        <Image
          src="/images/hero/1.png"
          alt="Content proof image"
          width={300}
          height={300}
          className="absolute left-1/2 -translate-x-1/2 rotate-0 animate-float-up-down rounded-lg object-cover shadow-lg"
          style={{ animationDelay: "0.5s" }}
        />
        <Image
          src="/images/hero/1.png"
          alt="Content proof image"
          width={300}
          height={300}
          className="absolute right-[10%] rotate-5 animate-float-up-down rounded-lg object-cover shadow-lg"
          style={{ animationDelay: "1s" }}
        />
      </div>
    </div>
  );
}

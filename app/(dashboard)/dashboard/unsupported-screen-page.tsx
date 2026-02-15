"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function UnsupportedScreenPage() {
  return (
    <div className="min-h-screen w-full bg-white flex flex-col items-center justify-center px-6 py-12">

      <h1 className="text-2xl font-bold text-foreground text-center mb-4 max-w-md">
        📵<br /> Blumpo works best on larger screens.
      </h1>
      <p className="text-base text-muted-foreground text-center max-w-md mb-2">
        Blumpo is currently optimized for desktop and laptop devices to give you
        the full brand-creation experience.
      </p>
      <p className="text-base text-foreground text-center max-w-md mb-10">
        Switch to your computer to build your brand, visuals, and voice without
        limits.
      </p>
      <Button asChild variant="cta" className="px-8 py-6 text-base rounded-full shadow-md hover:opacity-90">
        <Link href="/">Go home</Link>
      </Button>
      <Image
        src="/images/blumpo/sad-sitting-blumpo.png"
        alt="Blumpo"
        width={280}
        height={280}
        className="mt-12 object-contain"
        priority
      />
    </div>
  );
}

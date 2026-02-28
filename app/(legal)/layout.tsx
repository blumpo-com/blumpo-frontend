"use client";

import { LandingHeader } from "@/components/landing-header";
import { Footer } from "@/app/(landing)/_sections/footer-section";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col min-h-screen">
      <LandingHeader />
      {children}
      <Footer />
    </section>
  );
}

"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { UrlInput } from "@/components/url-input";
import { UrlInputSection } from "./url-input-section";
import { Button } from "@/components/ui/button";

export function Footer() {
  const [email, setEmail] = useState("");
  const [currentYear] = useState(new Date().getFullYear());

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement newsletter subscription
    console.log("Newsletter subscription:", email);
    setEmail("");
  };

  return (
    <footer className="w-full bg-gradient-to-b from-[rgba(249,250,251,0.5)] to-[rgba(198,240,234,0.5)] mt-20">
      {/* CTA Section */}
      <div className="flex flex-col gap-5 lg:gap-30 items-center justify-center px-4 py-[25px]">
        <h2 className="header-black">
          Ready to try Blumpo in action?
        </h2>
        <div className="w-full max-w-[712px] relative hidden lg:block">
          <Image
            src="/assets/animations/pointing-blumpo.webp"
            alt="Pointing Blumpo"
            width={210}
            height={140}
            className="absolute -top-40 right-2 z-10"
            style={{ clipPath: 'inset(0 40px 0 40px)' }}
          />
          <div className="hidden lg:block">
            <Suspense fallback={<div>Loading...</div>}>
              <UrlInputSection />
            </Suspense>
          </div>
        </div>

        <div className="flex flex-col items-center lg:hidden">
          <Button asChild variant="cta">
            <Link href="/dashboard" className="flex items-center gap-2">
              Make your first free Ad
              <ArrowRight className="w-6 h-6" />
            </Link>
          </Button>
          {/* Benefits list */}
        </div>
      </div>

      {/* Footer Content */}
      <div className="flex flex-col gap-[55px] px-4 sm:px-[60px] py-[42px]">
        <div className="flex flex-col gap-[55px] max-w-[1396px] mx-auto w-full">
          {/* Footer Columns */}
          <div className="flex flex-wrap gap-5 items-start justify-between">
            {/* Legal */}
            <div className="flex flex-col gap-6 w-[154px]">
              <h3 className="font-medium text-[20px] text-black">Legal</h3>
              <div className="flex flex-col gap-[14px] font-normal text-[18px] text-black">
                <Link href="/terms" className="hover:text-gray-600 transition-colors">
                  Terms of Service
                </Link>
                <Link href="/privacy" className="hover:text-gray-600 transition-colors">
                  Privacy policy
                </Link>
                <Link href="/refund" className="hover:text-gray-600 transition-colors">
                  Refund policy
                </Link>
              </div>
            </div>

            {/* Company */}
            <div className="flex flex-col gap-6 w-[154px]">
              <h3 className="font-medium text-[20px] text-black">Company</h3>
              <div className="flex flex-col gap-[14px] font-normal text-[18px] text-black">
                <Link href="#product" className="hover:text-gray-600 transition-colors">
                  How it works
                </Link>
                <Link href="/privacy" className="hover:text-gray-600 transition-colors">
                  Privacy policy
                </Link>
                <Link href="/refund" className="hover:text-gray-600 transition-colors">
                  Refund policy
                </Link>
                <Link href="/contact" className="hover:text-gray-600 transition-colors">
                  Contact us
                </Link>
              </div>
            </div>

            {/* Resources */}
            <div className="flex flex-col gap-6 w-[154px]">
              <h3 className="font-medium text-[20px] text-black">Resources</h3>
              <div className="flex flex-col gap-[14px] font-normal text-[18px] text-black">
                <Link href="/blog" className="hover:text-gray-600 transition-colors">
                  Blog
                </Link>
                <Link href="#pricing" className="hover:text-gray-600 transition-colors">
                  Pricing
                </Link>
                <Link href="/contact" className="hover:text-gray-600 transition-colors">
                  Contact us
                </Link>
              </div>
            </div>

            {/* Newsletter */}
            <div className="flex flex-col gap-6 w-full md:w-[403px]">
              <h3 className="font-medium text-[20px] text-black">Join our Newsletter</h3>
              <form onSubmit={handleEmailSubmit} className="relative">
                <div className="bg-[#0a0a0a] flex items-center justify-between px-5 py-[7px] rounded-[10px] h-[47px]">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email..."
                    className="flex-1 bg-transparent border-0 text-[#fdfdfd] text-[16px] placeholder:text-[#fdfdfd]/70 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="flex-shrink-0 w-7 h-7 rounded-full bg-white flex items-center justify-center hover:bg-gray-50 transition-colors"
                  >
                    <ArrowRight className="h-4 w-4 text-[#0a0a0a]" />
                  </button>
                </div>
              </form>
            </div>


          </div>

          {/* Socials */}
          <div className="flex flex-col gap-6 ">
            <h3 className="font-medium text-[20px] text-black">Socials</h3>
            <div className="flex gap-3 items-center">
              <Link
                href="https://linkedin.com/company/blumpo"
                target="_blank"
                rel="noopener noreferrer"
                className="w-[30px] h-[30px]"
              >
                <Image
                  src="/assets/social/linkedin.svg"
                  alt="LinkedIn"
                  width={30}
                  height={30}
                  className="w-full h-full object-contain"
                />
              </Link>
              <span className="font-medium text-[32px] text-black">/</span>
              <Link
                href="https://instagram.com/blumpo"
                target="_blank"
                rel="noopener noreferrer"
                className="w-[30px] h-[30px]"
              >
                <Image
                  src="/assets/social/instagram.svg"
                  alt="Instagram"
                  width={30}
                  height={30}
                  className="w-full h-full object-contain"
                />
              </Link>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="flex flex-row items-end justify-between gap-4 py-4">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <Image
                src="/assets/logo/Blumpo Logo.svg"
                alt="Blumpo"
                width={144}
                height={56}
                className="h-[56px] w-auto"
              />
            </Link>

            {/* Copyright */}
            <div className="flex flex-col sm:flex-row items-end justify-between gap-4 font-normal text-[14px] sm:text-[16px] text-[#0a0a0a]">
              <span>Blumpo {currentYear}</span>
              <span>© All Rights Reserved</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

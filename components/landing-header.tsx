"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Menu, ArrowRight } from "lucide-react";

const menuItems = [
  { href: "#use-cases", label: "Use cases" },
  { href: "#product", label: "Product" },
  { href: "#pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
  { href: "/dashboard", label: "Login" },
];

export function LandingHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const closeMenu = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsMenuOpen(false);
      setIsClosing(false);
    }, 300);
  };

  return (
    <>
      <header className="sticky top-0 z-50 flex justify-center py-4 px-4 bg-transparent">
        <div className="w-full max-w-8xl bg-white/80 backdrop-blur-sm rounded-full shadow-md px-4 md:px-6 py-4 flex justify-between items-center border-1 border-[#E5E7E]">
          <Link href="/" className="flex items-center">
            <img
              src="/assets/logo/Blumpo_Logo.svg"
              alt="Blumpo"
              className="h-8 md:h-9"
            />
          </Link>

          <button
            onClick={() => setIsMenuOpen(true)}
            className="lg:hidden flex items-center justify-center cursor-pointer p-2"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6 text-[#4a5565]" />
          </button>
          <nav className="hidden lg:flex items-center space-x-8">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="hidden lg:flex items-center ">
            <Button asChild variant="cta">
              <Link href="/sign-in?redirect=input-url">Make your first free Ad</Link>
            </Button>
          </div>
        </div>
      </header>

      {isMenuOpen && (
        <div
          className={`fixed inset-0 z-[60] bg-background shadow-[0px_4px_4px_0px_rgba(0,0,0,0.04)] ${isClosing ? 'animate-slide-up-to-top' : 'animate-slide-down-from-top'
            }`}
        >
          <div className="flex flex-col gap-[36px] h-full px-[40px] py-[17px]">
            <div className="flex items-center justify-between mt-4">
              <Link href="/" className="flex items-center">
                <img
                  src="/assets/logo/Blumpo_Logo.svg"
                  alt="Blumpo"
                  className="h-8 md:h-9"
                />
              </Link>
              <button
                onClick={closeMenu}
                className="cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-6 h-6 text-[#4a5565]" />
              </button>
            </div>

            <div className="flex flex-col gap-8 items-center justify-center flex-1">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                  className="text-[20px] font-normal text-[#4a5565] hover:text-gray-900"
                >
                  {item.label}
                </Link>
              ))}
              <Button asChild variant="cta">
                <Link href="/sign-in?redirect=input-url" className="flex items-center gap-2">
                  Make your first free Ad
                  <ArrowRight className="w-6 h-6" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

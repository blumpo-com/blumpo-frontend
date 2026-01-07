"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Home, LogOut, X, Menu, ArrowRight } from "lucide-react";
import { Footer } from "./footer-section";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { signOut } from "@/app/(login)/actions";
import { useRouter } from "next/navigation";
import { User } from "@/lib/db/schema";
import useSWR, { mutate } from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function UserMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: user } = useSWR<User>("/api/user", fetcher);
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    mutate("/api/user");
    router.push("/");
  }

  if (!user) {
    return (
      <>
        <Link
          href="/pricing"
          className="text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          Pricing
        </Link>
        <Button asChild className="rounded-full">
          <Link href="/sign-up">Sign Up</Link>
        </Button>
      </>
    );
  }

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger>
        <Avatar className="cursor-pointer size-9">
          <AvatarImage alt={user.displayName || ""} />
          <AvatarFallback>
            {user.displayName?.
              split(" ")
              .map((n) => n[0])
              .join("") || user.email?.split("@")[0]?.charAt(0)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="flex flex-col gap-1">
        <DropdownMenuItem className="cursor-pointer">
          <Link href="/dashboard" className="flex w-full items-center">
            <Home className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </DropdownMenuItem>
        <form action={handleSignOut} className="w-full">
          <button type="submit" className="flex w-full">
            <DropdownMenuItem className="w-full flex-1 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const menuItems = [
    { href: "#use-cases", label: "Use cases" },
    { href: "#product", label: "Product" },
    { href: "#pricing", label: "Pricing" },
    { href: "/blog", label: "Blog" },
    { href: "/dashboard", label: "Login" },
  ];

  const closeMenu = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsMenuOpen(false);
      setIsClosing(false);
    }, 300); // Match animation duration
  };

  return (
    <>
      <header className="sticky top-0 z-50 flex justify-center py-4 px-4 bg-transparent">
        <div className="w-full max-w-8xl bg-white/80 backdrop-blur-sm rounded-full shadow-md px-4 md:px-6 py-4 flex justify-between items-center border-1 border-[#E5E7E]">
          {/* Logo - always a link */}
          <Link href="/" className="flex items-center">
            <span className="text-xl md:text-2xl font-semibold text-[#00BFA6]">
              blumpo.com
            </span>
          </Link>
          
          {/* Mobile: Burger menu button */}
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
              <Link href="/dashboard">Make your first free Ad</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div 
          className={`fixed inset-0 z-[60] bg-background shadow-[0px_4px_4px_0px_rgba(0,0,0,0.04)] ${
            isClosing ? 'animate-slide-up-to-top' : 'animate-slide-down-from-top'
          }`}
        >
          <div className="flex flex-col gap-[36px] h-full px-[40px] py-[17px]">
            {/* Header with logo and close button */}
            <div className="flex items-center justify-between mt-4">
              <Link href="/" className="flex items-center">
                <span className="text-xl md:text-2xl font-semibold text-[#00BFA6]">
                  blumpo.com
                </span>
              </Link>
              <button
                onClick={closeMenu}
                className="cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-6 h-6 text-[#4a5565]" />
              </button>
            </div>

            {/* Menu items */}
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
                  <Link href="/dashboard" className="flex items-center gap-2">
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

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Hide header on dashboard routes (routes starting with /dashboard) and generating page
  const isDashboardRoute = pathname?.startsWith('/dashboard');
  const isGeneratingRoute = pathname?.startsWith('/generating');
  
  return (
    <section className="flex flex-col min-h-screen">
      {!isDashboardRoute && !isGeneratingRoute && <Header />}
      {children}
      {!isDashboardRoute && <Footer />}
    </section>
  );
}

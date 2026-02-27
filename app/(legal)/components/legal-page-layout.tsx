"use client";

import Link from "next/link";
import {
  createContext,
  useRef,
  useState,
  useCallback,
  useContext,
} from "react";

export type LegalSectionItem = { id: string; label: string };

const LegalPageContext = createContext<{
  registerSectionRef: (id: string, el: HTMLElement | null) => void;
} | null>(null);

export function useLegalSectionRef() {
  const ctx = useContext(LegalPageContext);
  if (!ctx) throw new Error("LegalSection must be used inside LegalPageLayout");
  return ctx.registerSectionRef;
}

type LegalPageLayoutProps = {
  title: string;
  lastUpdated: string;
  sections: readonly LegalSectionItem[];
  children: React.ReactNode;
};

export function LegalPageLayout({
  title,
  lastUpdated,
  sections,
  children,
}: LegalPageLayoutProps) {
  const [activeId, setActiveId] = useState<string>(sections[0].id);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const registerSectionRef = useCallback((id: string, el: HTMLElement | null) => {
    sectionRefs.current[id] = el;
  }, []);

  return (
    <LegalPageContext.Provider value={{ registerSectionRef }}>
      <main className="relative overflow-x-hidden">
        <div className="w-full pt-10 pb-6 px-4 flex flex-col items-center">
          <h1 className="header-gradient">{title}</h1>
          <p className="text-[#888e98] text-sm mt-2">
            Last updated: {lastUpdated}
          </p>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="bg-white rounded-2xl border border-[#e6f7e8] shadow-sm overflow-hidden">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 px-4 sm:px-6 lg:px-10 pb-10 pt-10">
              <nav
                className="lg:w-[28%] flex-shrink-0"
                aria-label="Table of contents"
              >
                <h3 className="font-bold text-[#040404] text-base mb-4">
                  Contents
                </h3>
                <ul className="space-y-1">
                  {sections.map((section, index) => {
                    const isActive = activeId === section.id;
                    return (
                      <li key={section.id}>
                        <Link
                          href={`#${section.id}`}
                          onClick={() => setActiveId(section.id)}
                          className={`block py-2.5 px-3 rounded-lg text-sm transition-colors ${isActive
                            ? "bg-foreground text-white font-medium"
                            : "text-[#374151] hover:bg-gray-100"
                            }`}
                        >
                          {index + 1}. {section.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              <div className="lg:flex-1 min-w-0 prose prose-gray max-w-none">
                {children}
              </div>
            </div>
          </div>
        </div>
      </main>
    </LegalPageContext.Provider>
  );
}

type LegalSectionProps = {
  id: string;
  number: number;
  title: string;
  children: React.ReactNode;
};

export function LegalSection({ id, number, title, children }: LegalSectionProps) {
  const registerSectionRef = useLegalSectionRef();

  return (
    <section
      id={id}
      ref={(el) => registerSectionRef(id, el)}
      className="scroll-mt-28 mb-8"
    >
      <h3 className="text-lg font-bold text-[#2e7d77] mb-3">
        {number}. {title}
      </h3>
      <div className="text-[#374151] text-base leading-relaxed space-y-3">
        {children}
      </div>
    </section>
  );
}

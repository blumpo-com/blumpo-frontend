"use client";

import Link from "next/link";
import { useRef, useState, useEffect } from "react";

const LAST_UPDATED = "02/19/2026";

const SECTIONS = [
  { id: "about-blumpo", label: "About Blumpo" },
  { id: "eligibility", label: "Eligibility" },
  { id: "accounts", label: "Accounts" },
  { id: "subscription-payments", label: "Subscription & Payments" },
  { id: "use-of-service", label: "Use of the Service" },
  { id: "customer-data", label: "Customer Data" },
  { id: "generated-content", label: "Generated Content" },
  { id: "intellectual-property", label: "Intellectual Property" },
  { id: "confidentiality", label: "Confidentiality" },
  { id: "disclaimer", label: "Disclaimer" },
  { id: "limitation-of-liability", label: "Limitation of Liability" },
  { id: "termination", label: "Termination" },
  { id: "changes-to-terms", label: "Changes to Terms" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

export default function TermsPage() {
  const [activeId, setActiveId] = useState<SectionId>(SECTIONS[0].id);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const updateActiveId = () => {
      const scrollY = window.scrollY;
      let current: SectionId = SECTIONS[0].id;
      for (const { id } of SECTIONS) {
        const el = sectionRefs.current[id];
        if (!el) continue;
        const top = el.getBoundingClientRect().top + scrollY;
        if (scrollY >= top - 120) {
          current = id;
        }
      }
      setActiveId(current);
    };

    window.addEventListener("scroll", updateActiveId, { passive: true });
    updateActiveId();

    return () => window.removeEventListener("scroll", updateActiveId);
  }, []);

  return (
    <main className="relative overflow-x-hidden">
      {/* Gradient header at the very top */}
      <div className="w-full pt-10 pb-6 px-4 flex flex-col items-center">
        <h1 className="header-gradient">Terms of service</h1>
        <p className="text-[#888e98] text-sm mt-2">
          Last updated: {LAST_UPDATED}
        </p>
      </div>

      {/* White content card with border */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-white rounded-2xl border border-[#e6f7e8] shadow-sm overflow-hidden">

          {/* Two columns: TOC + content */}
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 px-4 sm:px-6 lg:px-10 pb-10 pt-10">
            {/* Left: Contents sidebar */}
            <nav
              className="lg:w-[28%] flex-shrink-0"
              aria-label="Table of contents"
            >
              <h3 className="font-bold text-[#040404] text-base mb-4">
                Contents
              </h3>
              <ul className="space-y-1">
                {SECTIONS.map((section, index) => {
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

            {/* Right: Terms content */}
            <div className="lg:flex-1 min-w-0 prose prose-gray max-w-none">
              <p className="text-[#374151] text-base leading-relaxed mb-6">
                Blumpo These Terms of Service (&quot;Terms&quot;) govern access
                to and use of Blumpo&apos;s services (&quot;Service&quot;),
                including our website, applications, and related tools. By
                accessing or using the Service, you agree to be bound by these
                Terms.
              </p>

              <Section
                id={SECTIONS[0].id}
                number={1}
                innerRef={(el) => {
                  sectionRefs.current[SECTIONS[0].id] = el;
                }}
                title="About Blumpo"
              >
                <p>
                  Blumpo provides an AI-powered platform for creating
                  advertising and marketing content. Our Service helps businesses
                  generate ad creatives based on their brand, audience, and
                  goals.
                </p>
              </Section>

              <Section
                id={SECTIONS[1].id}
                number={2}
                innerRef={(el) => {
                  sectionRefs.current[SECTIONS[1].id] = el;
                }}
                title="Eligibility"
              >
                <p>
                  You must be at least 18 years old and have the legal capacity
                  to enter into contracts to use the Service. By using the
                  Service, you represent that you meet these requirements.
                </p>
              </Section>

              <Section
                id={SECTIONS[2].id}
                number={3}
                innerRef={(el) => {
                  sectionRefs.current[SECTIONS[2].id] = el;
                }}
                title="Accounts"
              >
                <p>
                  You may need to create an account to access certain features.
                  You are responsible for maintaining the confidentiality of
                  your account credentials and for all activity under your
                  account.
                </p>
              </Section>

              <Section
                id={SECTIONS[3].id}
                number={4}
                innerRef={(el) => {
                  sectionRefs.current[SECTIONS[3].id] = el;
                }}
                title="Subscription & Payments"
              >
                <p>
                  Some parts of the Service are offered on a subscription or
                  pay-per-use basis. By subscribing or making a purchase, you
                  agree to the applicable pricing and payment terms. Fees are
                  generally non-refundable unless otherwise stated or required
                  by law.
                </p>
              </Section>

              <Section
                id={SECTIONS[4].id}
                number={5}
                innerRef={(el) => {
                  sectionRefs.current[SECTIONS[4].id] = el;
                }}
                title="Use of the Service"
              >
                <p>
                  You agree to use the Service only for lawful purposes and in
                  accordance with these Terms. You may not use the Service to
                  create content that is illegal, harmful, infringing, or
                  otherwise objectionable.
                </p>
              </Section>

              <Section
                id={SECTIONS[5].id}
                number={6}
                innerRef={(el) => {
                  sectionRefs.current[SECTIONS[5].id] = el;
                }}
                title="Customer Data"
              >
                <p>
                  You retain ownership of the data you provide to the Service.
                  We process your data in accordance with our Privacy Policy and
                  use it solely to provide and improve the Service.
                </p>
              </Section>

              <Section
                id={SECTIONS[6].id}
                number={7}
                innerRef={(el) => {
                  sectionRefs.current[SECTIONS[6].id] = el;
                }}
                title="Generated Content"
              >
                <p>
                  Content generated by the Service is provided for your use
                  subject to these Terms and your subscription or purchase
                  terms. We do not guarantee that generated content will be
                  free of third-party rights; you are responsible for
                  appropriate use and clearance.
                </p>
              </Section>

              <Section
                id={SECTIONS[7].id}
                number={8}
                innerRef={(el) => {
                  sectionRefs.current[SECTIONS[7].id] = el;
                }}
                title="Intellectual Property"
              >
                <p>
                  Blumpo and its licensors own all rights in the Service,
                  including software, design, and branding. These Terms do not
                  grant you any rights to our intellectual property except the
                  limited right to use the Service as described.
                </p>
              </Section>

              <Section
                id={SECTIONS[8].id}
                number={9}
                innerRef={(el) => {
                  sectionRefs.current[SECTIONS[8].id] = el;
                }}
                title="Confidentiality"
              >
                <p>
                  You may receive confidential information from us. You agree to
                  keep such information confidential and not disclose it to
                  third parties without our prior written consent.
                </p>
              </Section>

              <Section
                id={SECTIONS[9].id}
                number={10}
                innerRef={(el) => {
                  sectionRefs.current[SECTIONS[9].id] = el;
                }}
                title="Disclaimer"
              >
                <p>
                  The Service is provided &quot;as is&quot; and &quot;as
                  available&quot; without warranties of any kind, either express
                  or implied. We do not warrant that the Service will be
                  uninterrupted, error-free, or free of harmful components.
                </p>
              </Section>

              <Section
                id={SECTIONS[10].id}
                number={11}
                innerRef={(el) => {
                  sectionRefs.current[SECTIONS[10].id] = el;
                }}
                title="Limitation of Liability"
              >
                <p>
                  To the maximum extent permitted by law, Blumpo shall not be
                  liable for any indirect, incidental, special, consequential, or
                  punitive damages, or for any loss of profits, data, or use of
                  the Service.
                </p>
              </Section>

              <Section
                id={SECTIONS[11].id}
                number={12}
                innerRef={(el) => {
                  sectionRefs.current[SECTIONS[11].id] = el;
                }}
                title="Termination"
              >
                <p>
                  We may suspend or terminate your access to the Service at any
                  time for violation of these Terms or for any other reason. You
                  may stop using the Service at any time.
                </p>
              </Section>

              <Section
                id={SECTIONS[12].id}
                number={13}
                innerRef={(el) => {
                  sectionRefs.current[SECTIONS[12].id] = el;
                }}
                title="Changes to Terms"
              >
                <p>
                  We may update these Terms from time to time. We will notify
                  you of material changes by posting the updated Terms and
                  updating the &quot;Last updated&quot; date. Your continued use
                  of the Service after such changes constitutes acceptance of
                  the new Terms.
                </p>
              </Section>

              <p className="text-[#374151] text-base mt-8">
                If you have questions, contact{" "}
                <a
                  href="mailto:support@blumpo.com"
                  className="text-[#00bfa6] hover:underline"
                >
                  support@blumpo.com
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Section({
  id,
  number,
  title,
  children,
  innerRef,
}: {
  id: string;
  number: number;
  title: string;
  children: React.ReactNode;
  innerRef: (el: HTMLElement | null) => void;
}) {
  return (
    <section
      id={id}
      ref={innerRef}
      className="scroll-mt-28 mb-8"
    >
      <h3 className="text-lg font-bold text-[#2e7d77] mb-3">{number}. {title}</h3>
      <div className="text-[#374151] text-base leading-relaxed space-y-3">
        {children}
      </div>
    </section>
  );
}

"use client";

import {
  LegalPageLayout,
  LegalSection,
} from "@/app/(legal)/components/legal-page-layout";

const LAST_UPDATED = "02/19/2026";

const SECTIONS = [
  { id: "refund-window", label: "3-Day Refund Window" },
  { id: "eligibility", label: "Eligibility" },
  { id: "how-to-request", label: "How to Request a Refund" },
  { id: "refund-processing", label: "Refund Processing" },
  { id: "non-refundable", label: "Non-Refundable Items" },
] as const;

export default function RefundPage() {
  return (
    <LegalPageLayout
      title="Refund Policy"
      lastUpdated={LAST_UPDATED}
      sections={SECTIONS}
    >
      <p className="text-[#374151] text-base leading-relaxed mb-6">
        Thank you for your purchase. We want you to feel confident when ordering
        from us. Please read the policy below carefully.
      </p>

      <LegalSection
        id={SECTIONS[0].id}
        number={1}
        title="3-Day Refund Window"
      >
        <p>
          We offer a 3-day refund policy from the date of purchase.
        </p>
        <p className="mt-3">
          You may request a refund within 3 calendar days of placing your
          order. After this period, we are unable to process a refund request.
        </p>
      </LegalSection>

      <LegalSection id={SECTIONS[1].id} number={2} title="Eligibility">
        <p>To qualify for a refund:</p>
        <ul className="list-disc pl-6 space-y-2 mt-2">
          <li>The request must be submitted within 3 days of purchase.</li>
          <li>
            Proof of purchase (order number and email used at checkout) must be
            provided.
          </li>
          <li>
            The product must not show signs of misuse, intentional damage, or
            unauthorized modification.
          </li>
          <li>
            For digital products or app-based services, eligibility may depend
            on whether the service has been activated or materially used.
          </li>
        </ul>
      </LegalSection>

      <LegalSection
        id={SECTIONS[2].id}
        number={3}
        title="How to Request a Refund"
      >
        <p>
          To request a refund, please contact our support team at:{" "}
          <a
            href="mailto:support@blumpo.com"
            className="text-[#00bfa6] hover:underline"
          >
            support@blumpo.com
          </a>
        </p>
        <p className="mt-3">Include:</p>
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li>Your full name</li>
          <li>Order number</li>
          <li>Date of purchase</li>
          <li>Reason for the refund request</li>
        </ul>
        <p className="mt-3">
          We aim to review all requests promptly and respond within 1–2 business
          days.
        </p>
      </LegalSection>

      <LegalSection
        id={SECTIONS[3].id}
        number={4}
        title="Refund Processing"
      >
        <p>
          If approved, refunds will be issued to the original method of payment.
        </p>
        <p className="mt-3">Please allow:</p>
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li>2–5 business days for the refund to be processed on our side</li>
          <li>Additional time depending on your payment provider</li>
        </ul>
        <p className="mt-3">
          We are not responsible for delays caused by banks or payment
          processors.
        </p>
      </LegalSection>

      <LegalSection
        id={SECTIONS[4].id}
        number={5}
        title="Non-Refundable Items"
      >
        <p>Refunds may not be granted in cases of:</p>
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li>Requests submitted after the 3-day window</li>
          <li>Products damaged due to improper use</li>
          <li>Fraudulent or abusive refund behavior</li>
        </ul>
      </LegalSection>
    </LegalPageLayout>
  );
}

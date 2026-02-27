"use client";

import {
  LegalPageLayout,
  LegalSection,
} from "@/app/(legal)/components/legal-page-layout";

const LAST_UPDATED = "19/02/2026";

const SECTIONS = [
  { id: "what-data-we-collect", label: "What Data We Collect" },
  { id: "how-we-use-data", label: "How We Use Data" },
  { id: "legal-basis-gdpr", label: "Legal Basis (GDPR)" },
  { id: "data-sharing", label: "Data Sharing" },
  { id: "international-transfers", label: "International Transfers" },
  { id: "data-retention", label: "Data Retention" },
  { id: "your-rights-gdpr", label: "Your Rights (GDPR)" },
  { id: "security", label: "Security" },
  { id: "ai-processing-public-data", label: "AI Processing & Public Data" },
  { id: "cookies", label: "Cookies" },
  { id: "marketing-communications", label: "Marketing Communications" },
  { id: "children", label: "Children" },
  { id: "changes-to-this-policy", label: "Changes to This Policy" },
  { id: "contact", label: "Contact" },
] as const;

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      lastUpdated={LAST_UPDATED}
      sections={SECTIONS}
    >
      <p className="text-[#374151] text-base leading-relaxed mb-6">
        Blumpo (&quot;Blumpo&quot;, &quot;we&quot;, &quot;our&quot;,
        &quot;us&quot;) respects your privacy and is committed to protecting
        your personal data. This Privacy Policy explains how we collect, use,
        store, and protect information when you use our website, platform, and
        related services (the &quot;Service&quot;).
      </p>

      <LegalSection
        id={SECTIONS[0].id}
        number={1}
        title="What Data We Collect"
      >
        <p>We may collect the following categories of data:</p>
        <p className="font-medium mt-2">A. Account Information</p>
        <ul className="list-disc pl-6 space-y-1 mt-1">
          <li>Name</li>
          <li>Company name</li>
          <li>Email address</li>
          <li>Billing details</li>
          <li>Login credentials</li>
        </ul>
        <p className="font-medium mt-3">B. Usage Data</p>
        <ul className="list-disc pl-6 space-y-1 mt-1">
          <li>IP address</li>
          <li>Browser type and device information</li>
          <li>Log files</li>
          <li>Platform interactions</li>
          <li>Feature usage statistics</li>
        </ul>
        <p className="font-medium mt-3">C. Payment Information</p>
        <p>
          Payments are processed by third-party providers - Stripe. We do not
          store full credit card details.
        </p>
        <p className="font-medium mt-3">D. Customer Input Data</p>
        <p>
          If you use Blumpo to generate ads, we may process: Website URLs,
          publicly available business data, ad copy prompts, uploaded
          materials.
        </p>
        <p className="mt-3">
          Blumpo does not intentionally collect sensitive personal data unless
          provided by the user.
        </p>
      </LegalSection>

      <LegalSection
        id={SECTIONS[1].id}
        number={2}
        title="How We Use Data"
      >
        <p>We use your data to:</p>
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li>Provide and operate the Service</li>
          <li>Generate AI-powered advertising content</li>
          <li>Improve product performance</li>
          <li>Process payments</li>
          <li>Provide customer support</li>
          <li>Prevent fraud and abuse</li>
          <li>Comply with legal obligations</li>
        </ul>
        <p className="mt-3">
          We may use aggregated and anonymized data for analytics and product
          improvement.
        </p>
      </LegalSection>

      <LegalSection
        id={SECTIONS[2].id}
        number={3}
        title="Legal Basis (GDPR)"
      >
        <p>
          If you are located in the European Economic Area (EEA), we process
          your personal data based on:
        </p>
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li>Contract performance (to provide the Service)</li>
          <li>Legitimate interest (security, product improvement)</li>
          <li>Legal obligation (accounting, compliance)</li>
          <li>Consent (where applicable, e.g., marketing emails)</li>
        </ul>
      </LegalSection>

      <LegalSection id={SECTIONS[3].id} number={4} title="Data Sharing">
        <p>We may share data with:</p>
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li>Hosting providers (e.g., cloud infrastructure providers)</li>
          <li>Payment processors</li>
          <li>Analytics providers</li>
          <li>Email service providers</li>
          <li>Legal or regulatory authorities (if required by law)</li>
        </ul>
        <p className="mt-3">
          All third parties are required to process data securely and in
          accordance with applicable laws. We do not sell personal data.
        </p>
      </LegalSection>

      <LegalSection
        id={SECTIONS[4].id}
        number={5}
        title="International Transfers"
      >
        <p>
          If personal data is transferred outside the EEA, we ensure appropriate
          safeguards such as:
        </p>
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li>Standard Contractual Clauses (SCCs)</li>
          <li>Adequacy decisions</li>
          <li>Equivalent legal protections</li>
        </ul>
      </LegalSection>

      <LegalSection
        id={SECTIONS[5].id}
        number={6}
        title="Data Retention"
      >
        <p>
          We retain personal data only as long as necessary to: provide the
          Service, fulfill contractual obligations, and comply with legal
          requirements. Inactive accounts may be deleted after a reasonable
          period.
        </p>
      </LegalSection>

      <LegalSection
        id={SECTIONS[6].id}
        number={7}
        title="Your Rights (GDPR)"
      >
        <p>If you are in the EEA, you have the right to:</p>
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li>Access your personal data</li>
          <li>Rectify inaccurate data</li>
          <li>Request deletion (&quot;right to be forgotten&quot;)</li>
          <li>Restrict processing</li>
          <li>Data portability</li>
          <li>Object to processing</li>
          <li>Withdraw consent at any time</li>
        </ul>
        <p className="mt-3">
          You may also lodge a complaint with your local supervisory authority.
        </p>
      </LegalSection>

      <LegalSection id={SECTIONS[7].id} number={8} title="Security">
        <p>
          We implement appropriate technical and organizational measures to
          protect data, including: encrypted data transmission (HTTPS), secure
          cloud infrastructure, access controls, and regular security
          monitoring. However, no system can guarantee absolute security.
        </p>
      </LegalSection>

      <LegalSection
        id={SECTIONS[8].id}
        number={9}
        title="AI Processing & Public Data"
      >
        <p>
          Blumpo may analyze publicly available online content (e.g., websites,
          social media, forums) to generate marketing insights and advertising
          materials.
        </p>
        <p className="mt-3">
          We process only data made publicly accessible by users or businesses
          and do not access private accounts or restricted data. Users are
          responsible for ensuring they have the right to submit any content
          uploaded to Blumpo.
        </p>
      </LegalSection>

      <LegalSection id={SECTIONS[9].id} number={10} title="Cookies">
        <p>We may use cookies and similar technologies to:</p>
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li>Authenticate users</li>
          <li>Improve platform functionality</li>
          <li>Analyze usage patterns</li>
        </ul>
        <p className="mt-3">
          Users may control cookies via browser settings.
        </p>
      </LegalSection>

      <LegalSection
        id={SECTIONS[10].id}
        number={11}
        title="Marketing Communications"
      >
        <p>
          We may send product updates or marketing emails. You can unsubscribe
          at any time via the link in the email.
        </p>
      </LegalSection>

      <LegalSection id={SECTIONS[11].id} number={12} title="Children">
        <p>
          Blumpo is not intended for individuals under 18 years of age.
        </p>
      </LegalSection>

      <LegalSection
        id={SECTIONS[12].id}
        number={13}
        title="Changes to This Policy"
      >
        <p>
          We may update this Privacy Policy from time to time. The latest
          version will always be available on our website with the updated
          effective date.
        </p>
      </LegalSection>

      <LegalSection id={SECTIONS[13].id} number={14} title="Contact">
        <p>
          For privacy-related inquiries:{" "}
          <a
            href="mailto:support@blumpo.com"
            className="text-[#00bfa6] hover:underline"
          >
            support@blumpo.com
          </a>
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}

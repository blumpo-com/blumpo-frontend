import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Blumpo",
  description: "Blumpo Terms of Service - governing access to and use of Blumpo's services.",
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

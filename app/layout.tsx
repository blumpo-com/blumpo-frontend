import "./globals.css";
import type { Metadata, Viewport } from "next";
// import { Manrope } from 'next/font/google';
import Script from "next/script";
import { getUser } from "@/lib/db/queries";
import { SWRConfig } from "swr";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Blumpo - AI-powered ad generator",
  description:
    "Blumpo turns customer insights from Reddit, YT, and your website into $500+ worth ads.",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  maximumScale: 1,
};

// const manrope = Manrope({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className="bg-white dark:bg-gray-950 text-black dark:text-white font-sans scroll-smooth"
    >
      <head>
        {/* GTM - HEAD */}
        <Script id="gtm-head" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-WWQTSFB4');
          `}
        </Script>
      </head>
      <body className="min-h-[100dvh] bg-gray-50">
        {/* GTM - NOSCRIPT */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-WWQTSFB4"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <Providers>
          <SWRConfig
            value={{
              fallback: {
                // We do NOT await here
                // Only components that read this data will suspend
                "/api/user": getUser(),
              },
            }}
          >
            {children}
          </SWRConfig>
        </Providers>
      </body>
    </html>
  );
}

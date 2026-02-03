import "./globals.css";
import type { Metadata, Viewport } from "next";
// import { Manrope } from 'next/font/google';
import Script from "next/script";
import { getUser } from "@/lib/db/queries";
import { SWRConfig } from "swr";
import { PageTitle } from "@/components/page-title";
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  const gtmUserId = user?.id ?? "";
  const gtmUserStatus = user ? "logged_in" : "guest";

  return (
    <html
      lang="en"
      className="bg-white dark:bg-gray-950 text-black dark:text-white font-sans scroll-smooth"
    >
      <head>
        {/* Data Layer: user_id & user_status (before GTM so GA can use them) */}
        <Script id="data-layer-user" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({
              'user_id': ${JSON.stringify(gtmUserId)},
              'user_status': ${JSON.stringify(gtmUserStatus)}
            });
          `}
        </Script>
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
        <PageTitle />
        <Providers>
          <SWRConfig
            value={{
              fallback: {
                "/api/user": user,
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

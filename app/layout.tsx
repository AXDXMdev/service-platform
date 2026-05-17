import type { Metadata } from "next";
import { Nunito_Sans, JetBrains_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { LanguageProvider } from "@/components/LanguageProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AccessibilityProvider } from "@/components/AccessibilityProvider";
import { SiteSettingsProvider } from "@/components/SiteSettingsProvider";
import ConsentBanner from "@/components/ConsentBanner";
import MarketingScripts from "@/components/MarketingScripts";
import ClientErrorReporter from "@/components/ClientErrorReporter";
import Navigation from "@/components/Navigation";
import SiteFooter from "@/components/SiteFooter";
import JsonLd from "@/components/JsonLd";
import { localMarketplaceJsonLd, organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import "./globals.css";

const uiSans = Nunito_Sans({
  variable: "--font-ui-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const uiMono = JetBrains_Mono({
  variable: "--font-ui-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  applicationName: "Hilfinio",
  manifest: "/manifest.webmanifest",
  title: {
    default: "Hilfinio - Lokale Hilfe und Dienstleistungen buchen",
    template: "%s | Hilfinio",
  },
  description:
    "Hilfinio ist die lokale Plattform für vertrauenswürdige Anbieter, klare Anfragen und sichere Kommunikation.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Hilfinio - Lokale Hilfe und Dienstleistungen buchen",
    description:
      "Finde verifizierte Anbieter, stelle klare Anfragen und verwalte Buchungen transparent.",
    url: "/",
    siteName: "Hilfinio",
    images: [
      {
        url: "/hilfinio-og.png",
        width: 1200,
        height: 630,
        alt: "Hilfinio Vorschau",
      },
    ],
    locale: "de_DE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hilfinio - Lokale Hilfe und Dienstleistungen buchen",
    description:
      "Finde verifizierte Anbieter, stelle klare Anfragen und verwalte Buchungen transparent.",
    images: ["/hilfinio-og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const adsClient = process.env.NEXT_PUBLIC_GOOGLE_ADS_CLIENT;

  return (
    <html
      lang="de"
      className={`${uiSans.variable} ${uiMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <JsonLd data={[organizationJsonLd(), websiteJsonLd(), localMarketplaceJsonLd()]} />
        <MarketingScripts adsClient={adsClient} />
        <ThemeProvider>
          <AccessibilityProvider>
            <LanguageProvider>
              <SiteSettingsProvider>
                <Navigation />
                <ClientErrorReporter />
                {children}
                <SiteFooter />
                <ConsentBanner enabled={Boolean(adsClient)} />
                <SpeedInsights />
              </SiteSettingsProvider>
            </LanguageProvider>
          </AccessibilityProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

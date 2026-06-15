import type { Metadata } from "next";
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
import { getBaseUrl, localMarketplaceJsonLd, organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { createServerSupabasePublicClient } from "@/lib/serverSupabase";
import { loadSiteSettingsPayload } from "@/services/siteSettingsReadService";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
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

export const revalidate = 300;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const adsClient = process.env.NEXT_PUBLIC_GOOGLE_ADS_CLIENT;
  const siteSettings = await loadSiteSettingsPayload(createServerSupabasePublicClient());

  return (
    <html
      lang="de"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <JsonLd data={[organizationJsonLd(), websiteJsonLd(), localMarketplaceJsonLd()]} />
        <MarketingScripts adsClient={adsClient} />
        <ThemeProvider>
          <AccessibilityProvider>
            <LanguageProvider>
              <SiteSettingsProvider initialSettings={siteSettings}>
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

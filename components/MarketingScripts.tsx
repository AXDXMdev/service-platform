"use client"

import Script from "next/script"
import { useEffect, useState } from "react"
import { hasMarketingConsent } from "@/components/ConsentBanner"

export default function MarketingScripts({ adsClient }: { adsClient: string | undefined }) {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    if (!adsClient) return

    const sync = () => setEnabled(hasMarketingConsent())
    sync()
    window.addEventListener("hilfinio-consent-changed", sync)
    return () => window.removeEventListener("hilfinio-consent-changed", sync)
  }, [adsClient])

  if (!adsClient || !enabled) return null

  return (
    <Script
      id="google-adsense"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsClient}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  )
}

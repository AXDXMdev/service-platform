"use client"

import { useEffect } from "react"
import { hasMarketingConsent } from "@/components/ConsentBanner"

declare global {
  interface Window {
    adsbygoogle?: unknown[]
  }
}

type AdSlotProps = {
  slot: string
  format?: "auto" | "rectangle" | "horizontal"
  className?: string
}

export default function AdSlot({
  slot,
  format = "auto",
  className,
}: AdSlotProps) {
  const adClient = process.env.NEXT_PUBLIC_GOOGLE_ADS_CLIENT
  const adEnabled = Boolean(adClient && slot && hasMarketingConsent())

  useEffect(() => {
    if (!adEnabled) return
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {
      // No-op in development or if ad script has not loaded yet.
    }
  }, [adEnabled, slot])

  if (!adEnabled) {
    return null
  }

  return (
    <div className={`rounded-[12px] border border-slate-200 p-2 dark:border-slate-700 ${className ?? ""}`}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={adClient}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  )
}

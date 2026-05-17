"use client"

import { useEffect } from "react"

export default function ClientErrorReporter() {
  useEffect(() => {
    const report = (payload: Record<string, unknown>) => {
      if (navigator.sendBeacon) {
        const body = new Blob([JSON.stringify(payload)], { type: "application/json" })
        navigator.sendBeacon("/api/observability", body)
        return
      }

      void fetch("/api/observability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      })
    }

    const onError = (event: ErrorEvent) => {
      report({
        level: "error",
        message: event.message,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
      })
    }

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      report({
        level: "error",
        message:
          event.reason instanceof Error
            ? event.reason.message
            : "Unhandled promise rejection",
      })
    }

    window.addEventListener("error", onError)
    window.addEventListener("unhandledrejection", onUnhandledRejection)
    return () => {
      window.removeEventListener("error", onError)
      window.removeEventListener("unhandledrejection", onUnhandledRejection)
    }
  }, [])

  return null
}

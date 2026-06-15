import type { MarketplaceOpsPayload } from "@/services/adminOpsService"

export type AdminOpsPayload = {
  generatedAt: string
  uploads: {
    totalRecent: number
    byStatus: Record<string, number>
    failedRecent: Array<{ id: string; status: string; created_at: string | null; error_message?: string | null }>
  }
  abuse: {
    totalRecent: number
    byStatus: Record<string, number>
    byCategory: Record<string, number>
  }
  deletionRequests: {
    totalRecent: number
    byStatus: Record<string, number>
  }
  security: {
    last24h: number
    warnings: number
    critical: number
    latest: Array<{ id: string; event_type: string; severity: string; route: string | null; created_at: string }>
  }
  marketplace: MarketplaceOpsPayload
}

export async function getAdminOpsData() {
  const response = await fetch("/api/admin/ops", {
    cache: "no-store",
    credentials: "same-origin",
  })
  const payload = await response.json().catch(() => null)

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error?.message ?? "Ops-Daten konnten nicht geladen werden.")
  }

  return payload.data as AdminOpsPayload
}

export async function runAdminOpsAction(input: {
  requestId: string
  action: "provider_contacted" | "request_escalated"
  note?: string | null
}) {
  const response = await fetch("/api/admin/ops", {
    method: "POST",
    cache: "no-store",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  const payload = await response.json().catch(() => null)

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error?.message ?? "Ops-Aktion konnte nicht gespeichert werden.")
  }

  return payload.data as {
    requestId: string
    action: "provider_contacted" | "request_escalated"
    priority: string
    internalNotes: string | null
  }
}

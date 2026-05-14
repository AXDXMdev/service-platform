import { mockAsync, serviceMode } from "../api/client"
import { bookingHistory } from "../data/mockData"
import { supabase } from "../lib/supabase"
import type { BookingDraft } from "../types"

export async function getMyRequests() {
  if (supabase) {
    const userResult = await supabase.auth.getUser()
    const user = userResult.data.user

    if (!user) {
      return []
    }

    const result = await supabase
      .from("requests")
      .select("id,created_at,status,service_id")
      .eq("sender_id", user.id)
      .neq("status", "deleted")

    if (result.error) {
      throw new Error(result.error.message)
    }

    const rows = result.data ?? []
    if (rows.length === 0) {
      return []
    }

    const serviceIds = [...new Set(rows.map((row) => row.service_id))]
    const serviceResult = await supabase
      .from("services")
      .select("id,title,provider_name")
      .in("id", serviceIds)

    if (serviceResult.error) {
      throw new Error(serviceResult.error.message)
    }

    const serviceMap = new Map(
      (serviceResult.data ?? []).map((service) => [service.id, service])
    )

    return rows.map((row) => ({
      id: row.id,
      providerName: serviceMap.get(row.service_id)?.provider_name ?? "Hilfinio Anbieter",
      serviceTitle: serviceMap.get(row.service_id)?.title ?? "Service",
      status: (row.status as "pending" | "accepted" | "completed") ?? "pending",
      dateLabel: row.created_at ? new Date(row.created_at).toLocaleDateString("de-DE") : "Offen",
    }))
  }

  return mockAsync(bookingHistory, 180)
}

export async function submitBookingRequest(input: BookingDraft) {
  if (!input.date.trim() || !input.message.trim()) {
    throw new Error("Bitte Wunschdatum und Nachricht angeben.")
  }

  if (supabase) {
    const userResult = await supabase.auth.getUser()
    const user = userResult.data.user

    if (!user) {
      throw new Error("Bitte zuerst einloggen.")
    }

    const parsedBudget = input.budget.trim()
      ? Number(input.budget.replace(/[^0-9.,]/g, "").replace(",", "."))
      : null

    if (parsedBudget !== null && !Number.isFinite(parsedBudget)) {
      throw new Error("Bitte ein gueltiges Budget eingeben.")
    }

    const result = await supabase
      .from("requests")
      .insert([
        {
          service_id: input.providerId,
          sender_id: user.id,
          sender_email: user.email ?? null,
          customer_budget_eur: parsedBudget,
        },
      ])
      .select("id")
      .single()

    if (result.error) {
      throw new Error(result.error.message)
    }

    return {
      ok: true,
      mode: serviceMode,
      requestId: result.data.id,
    }
  }

  return mockAsync(
    {
      ok: true,
      mode: serviceMode,
      requestId: `mock-${input.providerId}-${Date.now()}`,
    },
    280
  )
}

import { NextResponse } from "next/server"
import { apiError } from "@/lib/apiResponse"
import { requireAuthenticatedUser } from "@/lib/serverAuth"
import { createServerSupabaseAdminClient, getSupabaseServiceRoleEnv } from "@/lib/serverSupabase"
import { logServerError } from "@/lib/serverLogger"

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUser(request)
  if (auth.error || !auth.user) return auth.error

  if (!getSupabaseServiceRoleEnv()) {
    return apiError(
      503,
      "configuration_error",
      "Datenexport ist gerade nicht verfügbar. Bitte versuche es später erneut oder kontaktiere den Support."
    )
  }

  const supabase = createServerSupabaseAdminClient()
  if (!supabase) {
    return apiError(503, "configuration_error", "Supabase Admin Client konnte nicht initialisiert werden.")
  }

  const user = auth.user
  const userEmail = user.email ?? null

  const [profileResult, servicesResult, sentRequestsResult, favoritesResult, chatsResult, verificationResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("user_id,role,full_name,verification_level,created_at,updated_at")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("services")
        .select(
          "id,title,description,provider_name,city,district,provider_bio,years_experience,service_radius_km,approx_lat,approx_lng,supports_sign_language,text_chat_only,barrier_free_support,is_volunteer,is_verified,availability_days,availability_note,price_from_eur,is_active,created_at"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("requests")
        .select(
          "id,service_id,status,created_at,updated_at,customer_budget_eur,provider_offer_eur,final_price_eur,provider_note"
        )
        .eq("sender_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("favorites")
        .select("id,service_id,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("chat_messages")
        .select("id,request_id,message,created_at")
        .eq("sender_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("provider_verification_requests")
        .select("id,company_name,contact_email,city,website,proof_urls,status,created_at,reviewed_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ])

  for (const [key, result] of [
    ["profile", profileResult],
    ["services", servicesResult],
    ["sentRequests", sentRequestsResult],
    ["favorites", favoritesResult],
    ["chats", chatsResult],
    ["verification", verificationResult],
  ] as const) {
    if (result.error) {
      logServerError("Account export query failed", {
        userId: user.id,
        section: key,
        error: result.error.message,
      })
      return apiError(500, "upstream_error", "Datenexport konnte nicht erstellt werden.")
    }
  }

  const payload = {
    exportedAt: new Date().toISOString(),
    user: {
      id: user.id,
      email: userEmail,
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at,
    },
    profile: profileResult.data ?? null,
    services: servicesResult.data ?? [],
    sentRequests: sentRequestsResult.data ?? [],
    favorites: favoritesResult.data ?? [],
    sentChatMessages: chatsResult.data ?? [],
    verificationRequests: verificationResult.data ?? [],
    notes: [
      "Der Export enthält deine eigenen Konto-, Profil- und Inhaltsdaten in strukturierter Form.",
      "Daten anderer Nutzer werden bewusst nicht vollständig exportiert, auch wenn sie in gemeinsamen Prozessen vorkommen.",
    ],
  }

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename=\"hilfinio-export-${user.id}.json\"`,
      "Cache-Control": "no-store",
    },
  })
}

import { isSupabaseConfigured } from "../lib/supabase"

export const allowDemoMode = process.env.EXPO_PUBLIC_ENABLE_DEMO_MODE === "true"

export const serviceMode = (isSupabaseConfigured ? "supabase" : "mock") as
  | "mock"
  | "supabase"

export const plannedMobileApiEndpoints = {
  authLogin: "Supabase Auth signInWithPassword",
  authRegister: "Supabase Auth signUp",
  servicesList: "Supabase services select",
  serviceDetail: "Supabase services maybeSingle",
  requestsCreate: "Supabase requests insert",
  me: "Supabase Auth getUser",
  meRequests: "Supabase requests select",
  supportCreate: "Hilfinio support/report API pending native wiring",
} as const

export function requireConfiguredMobileBackend() {
  if (isSupabaseConfigured || allowDemoMode) return
  throw new Error(
    "Mobile Backend ist nicht konfiguriert. Bitte EXPO_PUBLIC_SUPABASE_URL und EXPO_PUBLIC_SUPABASE_ANON_KEY setzen."
  )
}

export async function mockAsync<T>(value: T, latency = 160) {
  requireConfiguredMobileBackend()
  await new Promise((resolve) => setTimeout(resolve, latency))
  return value
}

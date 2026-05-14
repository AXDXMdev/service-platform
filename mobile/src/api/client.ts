import { isSupabaseConfigured } from "../lib/supabase"

export const serviceMode = (isSupabaseConfigured ? "supabase" : "mock") as
  | "mock"
  | "supabase"

export const plannedMobileApiEndpoints = {
  authLogin: "TODO",
  authRegister: "TODO",
  servicesList: "TODO",
  serviceDetail: "TODO",
  requestsCreate: "TODO",
  me: "TODO",
  meRequests: "TODO",
  supportCreate: "TODO",
} as const

export async function mockAsync<T>(value: T, latency = 160) {
  await new Promise((resolve) => setTimeout(resolve, latency))
  return value
}

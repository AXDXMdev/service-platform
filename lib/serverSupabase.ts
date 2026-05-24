import { createClient } from "@supabase/supabase-js"
import { getServerEnv } from "@/lib/env"

function isPlaceholderSupabaseEnv(url: string, ...keys: string[]) {
  const normalizedUrl = url.toLowerCase()
  return (
    normalizedUrl.includes("example.supabase.co") ||
    normalizedUrl.includes("localhost") ||
    normalizedUrl.includes("127.0.0.1") ||
    keys.some((key) => key.startsWith("ci-"))
  )
}

export function getSupabasePublicEnv() {
  const env = getServerEnv()
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return null
  if (isPlaceholderSupabaseEnv(url, anonKey)) return null
  return { url, anonKey }
}

export function getSupabaseServiceRoleEnv() {
  const env = getServerEnv()
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) return null
  if (isPlaceholderSupabaseEnv(url, serviceRoleKey)) return null
  return { url, serviceRoleKey }
}

export function createServerSupabasePublicClient(authHeader?: string) {
  const env = getSupabasePublicEnv()
  if (!env) return null

  return createClient(env.url, env.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: authHeader ? { headers: { Authorization: authHeader } } : undefined,
  })
}

export function createServerSupabaseAdminClient() {
  const env = getSupabaseServiceRoleEnv()
  if (!env) return null

  return createClient(env.url, env.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

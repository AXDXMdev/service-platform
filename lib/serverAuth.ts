import { apiError } from "@/lib/apiResponse"
import { createServerSupabasePublicClient, getSupabasePublicEnv } from "@/lib/serverSupabase"

export async function requireAuthenticatedUser(request: Request) {
  if (!getSupabasePublicEnv()) {
    return { error: apiError(503, "configuration_error", "Supabase env vars fehlen."), user: null, authHeader: null }
  }

  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: apiError(401, "unauthorized", "Authorization fehlt."), user: null, authHeader: null }
  }

  const supabase = createServerSupabasePublicClient(authHeader)
  if (!supabase) {
    return {
      error: apiError(503, "configuration_error", "Supabase Client konnte nicht initialisiert werden."),
      user: null,
      authHeader: null,
    }
  }

  const userResult = await supabase.auth.getUser()
  const user = userResult.data.user
  if (!user) {
    return { error: apiError(401, "unauthorized", "Nicht eingeloggt."), user: null, authHeader: null }
  }

  return { error: null, user, authHeader, supabase }
}

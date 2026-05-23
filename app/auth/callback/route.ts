import { NextRequest, NextResponse } from "next/server"
import { getAuthBaseUrl, sanitizeAuthNextPath } from "@/lib/authRedirects"
import { createServerSupabasePublicClient } from "@/lib/serverSupabase"

function redirectTo(path: string) {
  return NextResponse.redirect(new URL(path, getAuthBaseUrl()))
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const next = sanitizeAuthNextPath(url.searchParams.get("next"), "/dashboard")

  if (!code) {
    return redirectTo(next)
  }

  const supabase = createServerSupabasePublicClient()
  if (!supabase) {
    return redirectTo("/login?error=auth_callback")
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return redirectTo("/login?error=auth_callback")
  }

  return redirectTo(next)
}

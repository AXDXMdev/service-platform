import { NextRequest, NextResponse } from "next/server"
import type { EmailOtpType } from "@supabase/supabase-js"
import { getAuthBaseUrl, sanitizeAuthNextPath } from "@/lib/authRedirects"
import { createServerSupabasePublicClient } from "@/lib/serverSupabase"

type SupabaseAuthCallbackClient = {
  auth: {
    exchangeCodeForSession: (code: string) => Promise<{ error: unknown | null }>
    verifyOtp: (params: { token_hash: string; type: EmailOtpType }) => Promise<{ error: unknown | null }>
  }
}

type AuthCallbackDeps = {
  createClient?: () => SupabaseAuthCallbackClient | null
}

const SUPABASE_EMAIL_OTP_TYPES = new Set<EmailOtpType>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
])

function redirectTo(path: string) {
  return NextResponse.redirect(new URL(path, getAuthBaseUrl()))
}

function sanitizeEmailOtpType(value: string | null): EmailOtpType | null {
  if (!value) return null
  return SUPABASE_EMAIL_OTP_TYPES.has(value as EmailOtpType) ? (value as EmailOtpType) : null
}

export function createAuthCallbackGetHandler(deps: AuthCallbackDeps = {}) {
  return async function GET(request: NextRequest) {
    const url = new URL(request.url)
    const code = url.searchParams.get("code")
    const tokenHash = url.searchParams.get("token_hash")
    const otpType = sanitizeEmailOtpType(url.searchParams.get("type"))
    const next = sanitizeAuthNextPath(url.searchParams.get("next"), "/dashboard")

    if (!code && !tokenHash) {
      return redirectTo("/login?error=auth_link_missing")
    }

    const supabase = (deps.createClient ?? createServerSupabasePublicClient)()
    if (!supabase) {
      return redirectTo("/login?error=auth_callback")
    }

    if (tokenHash) {
      if (!otpType) {
        return redirectTo("/login?error=auth_link_invalid")
      }

      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: otpType,
      })
      if (error) {
        return redirectTo("/login?error=auth_link_expired")
      }

      return redirectTo(next)
    }

    const { error } = await supabase.auth.exchangeCodeForSession(code as string)
    if (error) {
      return redirectTo("/login?error=auth_callback")
    }

    return redirectTo(next)
  }
}

export const GET = createAuthCallbackGetHandler()

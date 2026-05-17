import { apiError, apiOk } from "@/lib/apiResponse"
import { requireAuthenticatedUser } from "@/lib/serverAuth"
import { createServerSupabaseAdminClient, getSupabaseServiceRoleEnv } from "@/lib/serverSupabase"
import { getRequestIp, isRateLimited } from "@/lib/serverRateLimit"
import { createRequestLogContext, logServerError, logServerInfo } from "@/lib/serverLogger"
import { readJsonBody } from "@/lib/requestSecurity"
import { createSignedUploadGrant, validateUploadGrantInput } from "@/services/uploadService"

type UploadRouteDependencies = {
  requireUserContext: (request: Request) => Promise<{
    error: Response | null
    user: { id: string; email?: string | null } | null
  }>
  hasSupabaseEnv: () => boolean
  createAdminClient: () => unknown
  validateInput: (input: unknown) => ReturnType<typeof validateUploadGrantInput>
  createGrant: (
    admin: unknown,
    user: { id: string; email?: string | null },
    input: { kind: "serviceMedia" | "siteAsset"; fileName: string; fileSize: number; contentType: string }
  ) => Promise<{
    ok: true
    data: {
      bucket: "service-media" | "site-assets"
      path: string
      token: string
      publicUrl: string
      contentType: string
      maxBytes: number
    }
  } | {
    ok: false
    status: number
    message: string
  }>
  getRateLimitKey: (request: Request) => string
  isRateLimitedFn: (key: string) => boolean
}

const defaultDependencies: UploadRouteDependencies = {
  requireUserContext: requireAuthenticatedUser,
  hasSupabaseEnv: () => Boolean(getSupabaseServiceRoleEnv()),
  createAdminClient: createServerSupabaseAdminClient,
  validateInput: validateUploadGrantInput,
  createGrant: async (admin, user, input) =>
    createSignedUploadGrant(admin as never, user as never, input),
  getRateLimitKey: (request) => `uploads:${getRequestIp(request)}`,
  isRateLimitedFn: (key) => isRateLimited(key, 30, 10 * 60 * 1000),
}

export function createUploadsPostHandler(overrides: Partial<UploadRouteDependencies> = {}) {
  const deps = { ...defaultDependencies, ...overrides }

  return async function POST(request: Request) {
    const startedAt = Date.now()
    const logContext = createRequestLogContext(request, { route: "/api/uploads" })

    const rateLimitKey = deps.getRateLimitKey(request)
    if (deps.isRateLimitedFn(rateLimitKey)) {
      logServerInfo("Upload grant rate limited", {
        ...logContext,
        durationMs: Date.now() - startedAt,
      })
      return apiError(429, "rate_limited", "Zu viele Upload-Anfragen in kurzer Zeit. Bitte spaeter erneut.")
    }

    const auth = await deps.requireUserContext(request)
    if (auth.error || !auth.user) {
      return auth.error ?? apiError(401, "unauthorized", "Nicht eingeloggt.")
    }

    if (!deps.hasSupabaseEnv()) {
      return apiError(
        503,
        "configuration_error",
        "Upload-Freigaben benoetigen SUPABASE_SERVICE_ROLE_KEY auf dem Server."
      )
    }

    const json = await readJsonBody(request)
    if (!json.ok) return json.response
    const validation = deps.validateInput(json.body)
    if (!validation.ok) {
      return apiError(400, "bad_request", validation.message)
    }

    const admin = deps.createAdminClient()
    if (!admin) {
      return apiError(503, "configuration_error", "Supabase Admin Client konnte nicht initialisiert werden.")
    }

    const result = await deps.createGrant(admin, auth.user, validation.value)
    if (!result.ok) {
      const code = result.status === 403 ? "forbidden" : "upstream_error"
      if (result.status >= 500) {
        logServerError("Upload grant creation failed", {
          ...logContext,
          userId: auth.user.id,
          kind: validation.value.kind,
          message: result.message,
          durationMs: Date.now() - startedAt,
        })
      }
      return apiError(result.status, code, result.message)
    }

    logServerInfo("Upload grant created", {
      ...logContext,
      userId: auth.user.id,
      kind: validation.value.kind,
      durationMs: Date.now() - startedAt,
    })

    return apiOk(result.data)
  }
}

export const POST = createUploadsPostHandler()

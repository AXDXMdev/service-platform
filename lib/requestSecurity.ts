import { apiError } from "@/lib/apiResponse"

const JSON_CONTENT_TYPES = ["application/json", "application/merge-patch+json"]

export function requireSameOrigin(request: Request) {
  const url = new URL(request.url)
  const origin = request.headers.get("origin")
  const referer = request.headers.get("referer")

  if (origin && origin !== url.origin) {
    return apiError(403, "forbidden", "Ungültige Herkunft (Origin).")
  }

  if (!origin && referer) {
    const refererOrigin = new URL(referer).origin
    if (refererOrigin !== url.origin) {
      return apiError(403, "forbidden", "Ungültige Herkunft (Referer).")
    }
  }

  return null
}

export function requireJsonContentType(request: Request) {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? ""
  const isJson = JSON_CONTENT_TYPES.some((allowed) => contentType.includes(allowed))

  if (!isJson) {
    return apiError(415, "unsupported_media_type", "Content-Type muss application/json sein.")
  }

  return null
}

export async function readJsonBody(request: Request) {
  const contentTypeError = requireJsonContentType(request)
  if (contentTypeError) {
    return { ok: false as const, response: contentTypeError }
  }

  const body = await request.json().catch(() => null)
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return {
      ok: false as const,
      response: apiError(400, "bad_request", "Ungültiger Request-Body."),
    }
  }

  return { ok: true as const, body: body as Record<string, unknown> }
}

export const noStoreHeaders = {
  "Cache-Control": "no-store",
} as const

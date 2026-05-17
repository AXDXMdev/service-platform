import { supabase } from "@/lib/supabaseClient"
import type { UploadPreset } from "@/lib/mediaUpload"

async function getAccessToken() {
  const sessionResult = await supabase.auth.getSession()
  return sessionResult.data.session?.access_token ?? null
}

export async function authenticatedFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const token = await getAccessToken()
  const headers = new Headers(init.headers)
  if (token) headers.set("Authorization", `Bearer ${token}`)
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json")
  }

  return fetch(input, {
    ...init,
    headers,
  })
}

export async function readApiErrorMessage(response: Response) {
  const payload = (await response.json().catch(() => null)) as
    | { error?: { message?: string } }
    | null
  return payload?.error?.message ?? "Aktion fehlgeschlagen."
}

export async function requestSignedUpload(input: {
  kind: UploadPreset
  fileName: string
  fileSize: number
  contentType: string
}) {
  const response = await authenticatedFetch("/api/uploads", {
    method: "POST",
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response))
  }

  const payload = (await response.json()) as {
    data: {
      bucket: "service-media" | "site-assets"
      path: string
      token: string
      publicUrl: string
      contentType: string
      maxBytes: number
    }
  }

  return payload.data
}

export async function completeSignedUpload(input: {
  bucket: "service-media" | "site-assets"
  path: string
  fileSize: number
  contentType: string
}) {
  const response = await authenticatedFetch("/api/uploads/complete", {
    method: "POST",
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    return null
  }

  return response.json() as Promise<{
    data: {
      id: string
      status: "queued" | "duplicate"
      fingerprint: string
    }
  }>
}

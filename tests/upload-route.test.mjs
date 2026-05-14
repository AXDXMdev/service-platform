import test from "node:test"
import assert from "node:assert/strict"

const uploadRoute = await import("../app/api/uploads/route.ts")

function jsonRequest(body) {
  return new Request("http://localhost/api/uploads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

function unauthorizedResponse(message = "Login erforderlich.") {
  return new Response(
    JSON.stringify({
      ok: false,
      error: { code: "unauthorized", message },
    }),
    {
      status: 401,
      headers: { "Content-Type": "application/json" },
    }
  )
}

function fakeAuthSuccess() {
  return {
    error: null,
    user: { id: "user_1", email: "user@example.com" },
    supabase: { kind: "fake-supabase" },
  }
}

async function readJson(response) {
  return response.json()
}

test("uploads route blocks unauthenticated access", async () => {
  const handler = uploadRoute.createUploadsPostHandler({
    requireUserContext: async () => ({ error: unauthorizedResponse(), user: null, supabase: null }),
    hasSupabaseEnv: () => true,
    createAdminClient: () => ({ kind: "fake-admin" }),
    validateInput: () => ({ ok: true, value: { kind: "serviceMedia", fileName: "x.jpg", fileSize: 100, contentType: "image/jpeg" } }),
    createGrant: async () => ({ ok: true, data: {} }),
    isRateLimitedFn: () => false,
  })

  const response = await handler(jsonRequest({ kind: "serviceMedia" }))
  assert.equal(response.status, 401)
})

test("uploads route validates payload before grant creation", async () => {
  let called = false
  const handler = uploadRoute.createUploadsPostHandler({
    requireUserContext: async () => fakeAuthSuccess(),
    hasSupabaseEnv: () => true,
    createAdminClient: () => ({ kind: "fake-admin" }),
    validateInput: () => ({ ok: false, message: "Dateityp fehlt." }),
    createGrant: async () => {
      called = true
      return { ok: true, data: {} }
    },
    isRateLimitedFn: () => false,
  })

  const response = await handler(jsonRequest({ kind: "serviceMedia" }))
  const payload = await readJson(response)
  assert.equal(response.status, 400)
  assert.equal(payload.error.message, "Dateityp fehlt.")
  assert.equal(called, false)
})

test("uploads route returns forbidden for site asset uploads without admin access", async () => {
  const handler = uploadRoute.createUploadsPostHandler({
    requireUserContext: async () => fakeAuthSuccess(),
    hasSupabaseEnv: () => true,
    createAdminClient: () => ({ kind: "fake-admin" }),
    validateInput: () => ({
      ok: true,
      value: { kind: "siteAsset", fileName: "logo.png", fileSize: 100, contentType: "image/png" },
    }),
    createGrant: async () => ({ ok: false, status: 403, message: "Nur Admins duerfen Site-Assets hochladen." }),
    isRateLimitedFn: () => false,
  })

  const response = await handler(jsonRequest({ kind: "siteAsset" }))
  const payload = await readJson(response)
  assert.equal(response.status, 403)
  assert.equal(payload.error.code, "forbidden")
})

test("uploads route returns signed upload metadata for valid requests", async () => {
  const handler = uploadRoute.createUploadsPostHandler({
    requireUserContext: async () => fakeAuthSuccess(),
    hasSupabaseEnv: () => true,
    createAdminClient: () => ({ kind: "fake-admin" }),
    validateInput: () => ({
      ok: true,
      value: { kind: "serviceMedia", fileName: "foto.jpg", fileSize: 5000, contentType: "image/jpeg" },
    }),
    createGrant: async () => ({
      ok: true,
      data: {
        bucket: "service-media",
        path: "user_1/uuid-foto.jpg",
        token: "signed_token",
        publicUrl: "https://example.com/foto.jpg",
        contentType: "image/jpeg",
        maxBytes: 52428800,
      },
    }),
    isRateLimitedFn: () => false,
  })

  const response = await handler(jsonRequest({ kind: "serviceMedia" }))
  const payload = await readJson(response)
  assert.equal(response.status, 200)
  assert.equal(payload.data.bucket, "service-media")
  assert.equal(payload.data.token, "signed_token")
})

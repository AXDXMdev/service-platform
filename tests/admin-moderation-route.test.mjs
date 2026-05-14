import test from "node:test"
import assert from "node:assert/strict"

const adminModerationRoute = await import("../app/api/admin/moderation/route.ts")

function jsonRequest(body) {
  return new Request("http://localhost/api/admin/moderation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

async function readJson(response) {
  return response.json()
}

test("admin moderation route rejects missing admin session", async () => {
  const handler = adminModerationRoute.createAdminModerationPostHandler({
    getAdminCookieValue: async () => undefined,
    hasAdminSession: () => false,
    isConfigured: () => true,
    hasSupabaseEnv: () => true,
    createAdminClient: () => ({ kind: "fake-admin" }),
    executeAction: async () => ({ ok: true, message: "ok" }),
  })

  const response = await handler(jsonRequest({ action: "approveReviewProof", payload: {} }))
  assert.equal(response.status, 401)
})

test("admin moderation route validates action payloads", async () => {
  let called = false
  const handler = adminModerationRoute.createAdminModerationPostHandler({
    getAdminCookieValue: async () => "token",
    hasAdminSession: () => true,
    isConfigured: () => true,
    hasSupabaseEnv: () => true,
    createAdminClient: () => ({ kind: "fake-admin" }),
    executeAction: async () => {
      called = true
      return { ok: true, message: "ok" }
    },
  })

  const response = await handler(jsonRequest({ payload: {} }))
  const payload = await readJson(response)
  assert.equal(response.status, 400)
  assert.equal(payload.error.code, "bad_request")
  assert.equal(called, false)
})

test("admin moderation route returns success for valid actions", async () => {
  const handler = adminModerationRoute.createAdminModerationPostHandler({
    getAdminCookieValue: async () => "token",
    hasAdminSession: () => true,
    isConfigured: () => true,
    hasSupabaseEnv: () => true,
    createAdminClient: () => ({ kind: "fake-admin" }),
    executeAction: async (_supabase, input) => ({ ok: true, message: `${input.action}:ok` }),
  })

  const response = await handler(
    jsonRequest({
      action: "updateWaitlistStatus",
      payload: { actorUserId: "user_1", entryId: "entry_1", status: "contacted" },
    })
  )
  const payload = await readJson(response)
  assert.equal(response.status, 200)
  assert.equal(payload.data.message, "updateWaitlistStatus:ok")
})

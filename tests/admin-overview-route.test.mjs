import test from "node:test"
import assert from "node:assert/strict"

const adminOverviewRoute = await import("../app/api/admin/overview/route.ts")

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

function requestWithAuth() {
  return new Request("http://localhost/api/admin/overview", {
    method: "GET",
    headers: { Authorization: "Bearer token" },
  })
}

async function readJson(response) {
  return response.json()
}

test("admin overview route rejects missing admin session", async () => {
  const handler = adminOverviewRoute.createAdminOverviewGetHandler({
    getAdminCookieValue: async () => undefined,
    hasAdminSession: () => false,
    requireUserContext: async () => ({ error: unauthorizedResponse(), user: null }),
    hasSupabaseEnv: () => true,
    createAdminClient: () => ({ kind: "fake-admin" }),
    loadOverview: async () => ({ ok: true, data: {} }),
  })

  const response = await handler(requestWithAuth())
  assert.equal(response.status, 401)
})

test("admin overview route rejects missing bearer auth", async () => {
  const handler = adminOverviewRoute.createAdminOverviewGetHandler({
    getAdminCookieValue: async () => "token",
    hasAdminSession: () => true,
    requireUserContext: async () => ({ error: unauthorizedResponse(), user: null }),
    hasSupabaseEnv: () => true,
    createAdminClient: () => ({ kind: "fake-admin" }),
    loadOverview: async () => ({ ok: true, data: {} }),
  })

  const response = await handler(requestWithAuth())
  assert.equal(response.status, 401)
})

test("admin overview route returns data for valid admin requests", async () => {
  const handler = adminOverviewRoute.createAdminOverviewGetHandler({
    getAdminCookieValue: async () => "token",
    hasAdminSession: () => true,
    requireUserContext: async () => ({
      error: null,
      user: { id: "user_1", email: "admin@example.com" },
    }),
    hasSupabaseEnv: () => true,
    createAdminClient: () => ({ kind: "fake-admin" }),
    loadOverview: async (_supabase, userId) => ({
      ok: true,
      data: {
        role: "admin",
        actorUserId: userId,
        siteSettings: null,
        themeSettings: null,
        homepageSections: [],
        categories: [],
        services: [],
        providers: [],
        waitlist: [],
        siteContentEntries: [],
        pageContents: [],
        providerVerificationRequests: [],
        pendingReviews: [],
        auditEvents: [],
        warnings: [],
      },
    }),
  })

  const response = await handler(requestWithAuth())
  const payload = await readJson(response)
  assert.equal(response.status, 200)
  assert.equal(payload.data.role, "admin")
  assert.equal(payload.data.actorUserId, "user_1")
})

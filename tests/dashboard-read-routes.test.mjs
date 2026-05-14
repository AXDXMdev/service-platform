import test from "node:test"
import assert from "node:assert/strict"

const providerDashboardRoute = await import("../app/api/dashboard/provider/route.ts")
const customerDashboardRoute = await import("../app/api/dashboard/customer/route.ts")
const chatReadRoute = await import("../app/api/chat/[requestId]/route.ts")

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

test("provider dashboard route blocks unauthenticated access", async () => {
  const handler = providerDashboardRoute.createProviderDashboardGetHandler({
    requireUserContext: async () => ({ error: unauthorizedResponse(), user: null, supabase: null }),
    loadProviderDashboardData: async () => ({ ok: true, data: {} }),
  })

  const response = await handler(new Request("http://localhost/api/dashboard/provider"))
  assert.equal(response.status, 401)
})

test("provider dashboard route returns overview data", async () => {
  const handler = providerDashboardRoute.createProviderDashboardGetHandler({
    requireUserContext: async () => fakeAuthSuccess(),
    loadProviderDashboardData: async () => ({
      ok: true,
      data: { currentUserId: "user_1", services: [], requests: [] },
    }),
  })

  const response = await handler(new Request("http://localhost/api/dashboard/provider"))
  const payload = await readJson(response)
  assert.equal(response.status, 200)
  assert.equal(payload.data.currentUserId, "user_1")
})

test("customer dashboard route returns customer request data", async () => {
  const handler = customerDashboardRoute.createCustomerDashboardGetHandler({
    requireUserContext: async () => fakeAuthSuccess(),
    loadCustomerRequestsData: async () => ({
      ok: true,
      data: { currentUserId: "user_1", requests: [], services: [], reviews: [] },
    }),
  })

  const response = await handler(new Request("http://localhost/api/dashboard/customer"))
  const payload = await readJson(response)
  assert.equal(response.status, 200)
  assert.deepEqual(payload.data.requests, [])
})

test("chat read route returns not found when user cannot access request", async () => {
  const handler = chatReadRoute.createChatGetHandler({
    requireUserContext: async () => fakeAuthSuccess(),
    loadChatMessages: async () => ({
      ok: false,
      status: 404,
      message: "Chat nicht gefunden.",
    }),
  })

  const response = await handler(
    new Request("http://localhost/api/chat/req_1"),
    { params: Promise.resolve({ requestId: "req_1" }) }
  )
  assert.equal(response.status, 404)
})

test("chat read route returns chat messages for participants", async () => {
  const handler = chatReadRoute.createChatGetHandler({
    requireUserContext: async () => fakeAuthSuccess(),
    loadChatMessages: async () => ({
      ok: true,
      data: { currentUserId: "user_1", requestId: "req_1", messages: [] },
    }),
  })

  const response = await handler(
    new Request("http://localhost/api/chat/req_1"),
    { params: Promise.resolve({ requestId: "req_1" }) }
  )
  const payload = await readJson(response)
  assert.equal(response.status, 200)
  assert.equal(payload.data.requestId, "req_1")
})

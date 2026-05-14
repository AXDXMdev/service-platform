import test from "node:test"
import assert from "node:assert/strict"

const requestsRoute = await import("../app/api/requests/route.ts")
const requestStatusRoute = await import("../app/api/requests/[id]/status/route.ts")
const chatRoute = await import("../app/api/chat/route.ts")
const favoritesRoute = await import("../app/api/favorites/route.ts")
const reviewsRoute = await import("../app/api/reviews/route.ts")

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

function jsonRequest(url, body, init = {}) {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
    body: JSON.stringify(body),
    ...init,
  })
}

async function readJson(response) {
  return response.json()
}

test("requests route blocks unauthenticated access", async () => {
  const handler = requestsRoute.createRequestsPostHandler({
    requireUserContext: async () => ({ error: unauthorizedResponse(), user: null, supabase: null }),
    createRequest: async () => ({ ok: true, data: {} }),
    validateRequestCreateInput: () => ({ ok: true, value: { serviceId: "svc_1", customerBudgetEur: null } }),
  })

  const response = await handler(jsonRequest("http://localhost/api/requests", {}))
  assert.equal(response.status, 401)
})

test("requests route validates payload before creating requests", async () => {
  let called = false
  const handler = requestsRoute.createRequestsPostHandler({
    requireUserContext: async () => fakeAuthSuccess(),
    createRequest: async () => {
      called = true
      return { ok: true, data: {} }
    },
    validateRequestCreateInput: () => ({ ok: false, message: "Service fehlt." }),
  })

  const response = await handler(jsonRequest("http://localhost/api/requests", {}))
  const payload = await readJson(response)
  assert.equal(response.status, 400)
  assert.equal(payload.error.message, "Service fehlt.")
  assert.equal(called, false)
})

test("request status route returns forbidden when transition is denied", async () => {
  const handler = requestStatusRoute.createRequestStatusPatchHandler({
    requireUserContext: async () => fakeAuthSuccess(),
    updateRequestStatus: async () => ({ ok: false, status: 403, message: "Keine Berechtigung." }),
    validateRequestStatusInput: () => ({
      ok: true,
      value: { nextStatus: "accepted", note: null },
    }),
  })

  const response = await handler(
    jsonRequest("http://localhost/api/requests/req_1/status", { nextStatus: "accepted" }, { method: "PATCH" }),
    { params: Promise.resolve({ id: "req_1" }) }
  )
  const payload = await readJson(response)
  assert.equal(response.status, 403)
  assert.equal(payload.error.code, "forbidden")
})

test("chat route requires a valid message body", async () => {
  let called = false
  const handler = chatRoute.createChatPostHandler({
    requireUserContext: async () => fakeAuthSuccess(),
    createChatMessage: async () => {
      called = true
      return { ok: true, data: {} }
    },
    validateChatMessageInput: () => ({ ok: false, message: "Nachricht darf nicht leer sein." }),
  })

  const response = await handler(jsonRequest("http://localhost/api/chat", { message: "" }))
  const payload = await readJson(response)
  assert.equal(response.status, 400)
  assert.equal(payload.error.message, "Nachricht darf nicht leer sein.")
  assert.equal(called, false)
})

test("favorites route can add and remove favorites for authenticated users", async () => {
  const postHandler = favoritesRoute.createFavoritesPostHandler({
    requireUserContext: async () => fakeAuthSuccess(),
    addFavorite: async (_supabase, _user, input) => ({ ok: true, data: { id: "fav_1", ...input } }),
    removeFavorite: async () => ({ ok: true, data: { serviceId: "svc_1" } }),
    validateFavoriteInput: () => ({ ok: true, value: { serviceId: "svc_1" } }),
  })

  const deleteHandler = favoritesRoute.createFavoritesDeleteHandler({
    requireUserContext: async () => fakeAuthSuccess(),
    addFavorite: async () => ({ ok: true, data: {} }),
    removeFavorite: async (_supabase, _user, input) => ({ ok: true, data: input }),
    validateFavoriteInput: () => ({ ok: true, value: { serviceId: "svc_1" } }),
  })

  const addResponse = await postHandler(jsonRequest("http://localhost/api/favorites", { serviceId: "svc_1" }))
  const removeResponse = await deleteHandler(
    jsonRequest("http://localhost/api/favorites", { serviceId: "svc_1" }, { method: "DELETE" })
  )

  assert.equal(addResponse.status, 200)
  assert.equal(removeResponse.status, 200)
})

test("reviews route rate-limits before auth and service execution", async () => {
  let authCalled = false
  let reviewCalled = false
  const handler = reviewsRoute.createReviewsPostHandler({
    getRequestIp: () => "127.0.0.1",
    isRateLimited: () => true,
    requireUserContext: async () => {
      authCalled = true
      return fakeAuthSuccess()
    },
    createReview: async () => {
      reviewCalled = true
      return { ok: true, data: {} }
    },
    validateReviewCreateInput: () => ({
      ok: true,
      value: {
        requestId: "req_1",
        serviceId: "svc_1",
        rating: 5,
        comment: null,
        proofUrls: ["https://example.com/proof.jpg"],
      },
    }),
  })

  const response = await handler(jsonRequest("http://localhost/api/reviews", {}))
  assert.equal(response.status, 429)
  assert.equal(authCalled, false)
  assert.equal(reviewCalled, false)
})

test("reviews route returns conflict when a user already reviewed a request", async () => {
  const handler = reviewsRoute.createReviewsPostHandler({
    getRequestIp: () => "127.0.0.1",
    isRateLimited: () => false,
    requireUserContext: async () => fakeAuthSuccess(),
    createReview: async () => ({
      ok: false,
      status: 409,
      message: "Zu dieser Anfrage existiert bereits eine Bewertung.",
    }),
    validateReviewCreateInput: () => ({
      ok: true,
      value: {
        requestId: "req_1",
        serviceId: "svc_1",
        rating: 5,
        comment: "Top",
        proofUrls: ["https://example.com/proof.jpg"],
      },
    }),
  })

  const response = await handler(jsonRequest("http://localhost/api/reviews", {}))
  const payload = await readJson(response)
  assert.equal(response.status, 409)
  assert.equal(payload.error.message, "Zu dieser Anfrage existiert bereits eine Bewertung.")
})

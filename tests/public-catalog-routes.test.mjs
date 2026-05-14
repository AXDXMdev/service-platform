import test from "node:test"
import assert from "node:assert/strict"

const publicHomeRoute = await import("../app/api/public/home/route.ts")
const publicServicesRoute = await import("../app/api/public/services/route.ts")
const providerProfileRoute = await import("../app/api/providers/[id]/route.ts")

async function readJson(response) {
  return response.json()
}

test("public home route returns featured services", async () => {
  const handler = publicHomeRoute.createPublicHomeGetHandler({
    hasSupabaseEnv: () => true,
    createPublicClient: () => ({ kind: "fake-public" }),
    loadHomeFeaturedData: async () => ({
      ok: true,
      data: { featuredServices: [], ratingsByService: {} },
    }),
  })

  const response = await handler()
  const payload = await readJson(response)
  assert.equal(response.status, 200)
  assert.deepEqual(payload.data.featuredServices, [])
})

test("public services route reports upstream errors", async () => {
  const handler = publicServicesRoute.createPublicServicesGetHandler({
    hasSupabaseEnv: () => true,
    createPublicClient: () => ({ kind: "fake-public" }),
    loadServicesCatalogData: async () => ({
      ok: false,
      status: 500,
      message: "Services konnten nicht geladen werden.",
    }),
  })

  const response = await handler()
  assert.equal(response.status, 500)
})

test("provider profile route returns services for provider id", async () => {
  const providerId = "550e8400-e29b-41d4-a716-446655440000"
  const handler = providerProfileRoute.createProviderProfileGetHandler({
    hasSupabaseEnv: () => true,
    createPublicClient: () => ({ kind: "fake-public" }),
    loadProviderProfileData: async (_supabase, providerId) => ({
      ok: true,
      data: {
        services: [{ id: "svc_1", title: "Haushaltshilfe", user_id: providerId }],
      },
    }),
  })

  const response = await handler(new Request("http://localhost/api/providers/provider_1"), {
    params: Promise.resolve({ id: providerId }),
  })
  const payload = await readJson(response)
  assert.equal(response.status, 200)
  assert.equal(payload.data.services[0].user_id, providerId)
})

test("provider profile route rejects malformed provider ids", async () => {
  const handler = providerProfileRoute.createProviderProfileGetHandler({
    hasSupabaseEnv: () => true,
    createPublicClient: () => ({ kind: "fake-public" }),
    loadProviderProfileData: async () => ({
      ok: false,
      status: 400,
      message: "Anbieter-ID ist ungueltig.",
    }),
  })

  const response = await handler(new Request("http://localhost/api/providers/not-a-uuid"), {
    params: Promise.resolve({ id: "not-a-uuid" }),
  })
  assert.equal(response.status, 400)
})

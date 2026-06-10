import test from "node:test"
import assert from "node:assert/strict"

const adminOpsRoute = await import("../app/api/admin/ops/route.ts")

function request() {
  return new Request("http://localhost/api/admin/ops", { method: "GET" })
}

async function readJson(response) {
  return response.json()
}

function emptyQuery(data = []) {
  return { data, error: null }
}

function fakeTable() {
  return {
    select() {
      return this
    },
    order() {
      return this
    },
    limit() {
      return emptyQuery([])
    },
    gte() {
      return this
    },
  }
}

test("admin ops route rejects missing admin session", async () => {
  const handler = adminOpsRoute.createAdminOpsGetHandler({
    getAdminCookieValue: async () => undefined,
    hasAdminSession: () => false,
    hasSupabaseEnv: () => true,
    createAdminClient: () => ({ kind: "fake-admin" }),
    loadMarketplaceOpsData: async () => ({
      ok: true,
      data: {
        generatedAt: "2026-06-10T00:00:00.000Z",
        sla: {
          openUnanswered: 0,
          watch: 0,
          critical: 0,
          lost: 0,
          answeredWithin4hLast7d: 0,
          responseRate4hLast7d: null,
          recentRequestCount: 0,
        },
        unansweredRequests: [],
        providerRisks: [],
      },
    }),
  })

  const response = await handler(request())
  assert.equal(response.status, 401)
})

test("admin ops route returns marketplace SLA data", async () => {
  const handler = adminOpsRoute.createAdminOpsGetHandler({
    getAdminCookieValue: async () => "token",
    hasAdminSession: () => true,
    hasSupabaseEnv: () => true,
    createAdminClient: () => ({
      from() {
        return fakeTable()
      },
    }),
    loadMarketplaceOpsData: async () => ({
      ok: true,
      data: {
        generatedAt: "2026-06-10T00:00:00.000Z",
        sla: {
          openUnanswered: 2,
          watch: 1,
          critical: 1,
          lost: 0,
          answeredWithin4hLast7d: 7,
          responseRate4hLast7d: 70,
          recentRequestCount: 10,
        },
        unansweredRequests: [
          {
            id: "req_1",
            serviceId: "svc_1",
            serviceTitle: "Reinigung Stuttgart",
            providerId: "provider_1",
            providerName: "Sauber GmbH",
            providerCity: "Stuttgart",
            customerEmail: "kunde@example.com",
            status: "pending",
            createdAt: "2026-06-09T20:00:00.000Z",
            updatedAt: null,
            ageHours: 4,
            slaTone: "critical",
            firstMessagePreview: "Bitte morgen reinigen.",
            budgetEur: 80,
            preferredDate: "morgen",
            requestLocation: "Stuttgart West",
            lastCustomerMessageAt: "2026-06-09T20:00:00.000Z",
            recommendedAction: "Anbieter sofort erinnern oder manuell neu zuweisen.",
          },
        ],
        providerRisks: [
          {
            providerId: "provider_1",
            providerName: "Sauber GmbH",
            city: "Stuttgart",
            unansweredCount: 1,
            criticalCount: 1,
            oldestAgeHours: 4,
            serviceTitles: ["Reinigung Stuttgart"],
          },
        ],
      },
    }),
  })

  const response = await handler(request())
  const payload = await readJson(response)
  assert.equal(response.status, 200)
  assert.equal(payload.data.marketplace.sla.openUnanswered, 2)
  assert.equal(payload.data.marketplace.unansweredRequests[0].slaTone, "critical")
  assert.equal(payload.data.marketplace.providerRisks[0].providerName, "Sauber GmbH")
})

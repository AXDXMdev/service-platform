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
            providerEmail: "provider@example.com",
            providerCity: "Stuttgart",
            customerEmail: "kunde@example.com",
            status: "pending",
            createdAt: "2026-06-09T20:00:00.000Z",
            updatedAt: null,
            ageHours: 4,
            slaTone: "critical",
            slaDueAt: "2026-06-10T00:00:00.000Z",
            nextTouchAt: "2026-06-09T20:00:00.000Z",
            firstMessagePreview: "Bitte morgen reinigen.",
            budgetEur: 80,
            preferredDate: "morgen",
            requestLocation: "Stuttgart West",
            lastCustomerMessageAt: "2026-06-09T20:00:00.000Z",
            recommendedAction: "Anbieter sofort erinnern oder manuell neu zuweisen.",
            providerActivationText: "Bitte antworten.",
            customerHoldingText: "Wir melden uns.",
          },
        ],
        providerRisks: [
          {
            providerId: "provider_1",
            providerName: "Sauber GmbH",
            providerEmail: "provider@example.com",
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

test("admin ops route records provider contact actions", async () => {
  const writes = []
  const fakeAdmin = {
    from(table) {
      return {
        select() {
          return this
        },
        eq(field, value) {
          writes.push({ table, op: "eq", field, value })
          return this
        },
        maybeSingle() {
          return Promise.resolve({
            data: {
              id: "req_1",
              status: "pending",
              priority: "normal",
              internal_notes: "old note",
            },
            error: null,
          })
        },
        update(payload) {
          writes.push({ table, op: "update", payload })
          return {
            eq() {
              return this
            },
            select() {
              return this
            },
            single() {
              return Promise.resolve({
                data: {
                  id: "req_1",
                  priority: payload.priority,
                  internal_notes: payload.internal_notes,
                },
                error: null,
              })
            },
          }
        },
        insert(payload) {
          writes.push({ table, op: "insert", payload })
          return Promise.resolve({ error: null })
        },
      }
    },
  }

  const handler = adminOpsRoute.createAdminOpsPostHandler({
    getAdminCookieValue: async () => "token",
    getAdminActorCookieValue: async () => "admin_1",
    hasAdminSession: () => true,
    hasSupabaseEnv: () => true,
    createAdminClient: () => fakeAdmin,
  })

  const response = await handler(
    new Request("http://localhost/api/admin/ops", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "http://localhost" },
      body: JSON.stringify({
        requestId: "req_1",
        action: "provider_contacted",
        note: "Provider angerufen",
      }),
    })
  )
  const payload = await readJson(response)

  assert.equal(response.status, 200)
  assert.equal(payload.data.priority, "high")
  assert.equal(writes.find((write) => write.table === "requests" && write.op === "update").payload.priority, "high")
  assert.match(
    writes.find((write) => write.table === "request_events" && write.op === "insert").payload[0].note,
    /Provider angerufen/
  )
})

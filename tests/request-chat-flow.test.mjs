import test from "node:test"
import assert from "node:assert/strict"

const requestService = await import("../services/requestService.ts")
const chatService = await import("../services/chatService.ts")
const reviewService = await import("../services/reviewService.ts")

function createFakeSupabase(seed) {
  const writes = []

  function rowsFor(table, filters) {
    const rows = seed[table] ?? []
    return rows.filter((row) => filters.every((filter) => row[filter.column] === filter.value))
  }

  function builder(table) {
    const filters = []
    const api = {
      select() {
        return api
      },
      eq(column, value) {
        filters.push({ column, value })
        return api
      },
      single: async () => {
        const row = rowsFor(table, filters)[0] ?? null
        return row ? { data: row, error: null } : { data: null, error: { message: "not found" } }
      },
      maybeSingle() {
        const row = rowsFor(table, filters)[0] ?? null
        const result = { data: row, error: null }
        return {
          returns: async () => result,
          then(resolve) {
            resolve(result)
          },
        }
      },
      insert(payload) {
        const item = Array.isArray(payload) ? payload[0] : payload
        const row = {
          id: `${table}_${writes.length + 1}`,
          created_at: "2026-05-18T10:15:00.000Z",
          ...item,
        }
        writes.push({ table, op: "insert", payload: row })
        seed[table] = [...(seed[table] ?? []), row]
        return {
          select() {
            return {
              single: async () => ({ data: row, error: null }),
            }
          },
          then(resolve) {
            resolve({ data: row, error: null })
          },
        }
      },
      update(payload) {
        return {
          eq: async (column, value) => {
            writes.push({ table, op: "update", payload, column, value })
            seed[table] = (seed[table] ?? []).map((row) =>
              row[column] === value ? { ...row, ...payload } : row
            )
            return { data: null, error: null }
          },
        }
      },
    }
    return api
  }

  return {
    writes,
    from: builder,
  }
}

test("customer can request a foreign service and first message is stored", async () => {
  const supabase = createFakeSupabase({
    services: [{ id: "svc_1", user_id: "provider_1" }],
    requests: [],
    chat_messages: [],
  })

  const result = await requestService.createRequest(
    supabase,
    { id: "customer_1", email: "customer@example.com" },
    {
      serviceId: "svc_1",
      message: "Ich brauche Hilfe beim Umzug am Freitag.",
      customerBudgetEur: 120,
      preferredDate: "Freitag",
      location: "Stuttgart",
      contactPreference: "Hilfinio Chat",
    }
  )

  assert.equal(result.ok, true)
  assert.equal(supabase.writes.some((write) => write.table === "requests"), true)
  const messageWrite = supabase.writes.find((write) => write.table === "chat_messages")
  assert.equal(messageWrite.payload.receiver_id, "provider_1")
  assert.equal(messageWrite.payload.body, "Ich brauche Hilfe beim Umzug am Freitag.")
})

test("customer cannot request own service", async () => {
  const supabase = createFakeSupabase({
    services: [{ id: "svc_1", user_id: "customer_1" }],
  })

  const result = await requestService.createRequest(
    supabase,
    { id: "customer_1", email: "customer@example.com" },
    {
      serviceId: "svc_1",
      message: "Ich brauche Hilfe beim Umzug.",
      customerBudgetEur: null,
    }
  )

  assert.equal(result.ok, false)
  assert.equal(result.status, 403)
})

test("first provider message sets first_provider_response_at", async () => {
  const supabase = createFakeSupabase({
    requests: [
      {
        id: "req_1",
        sender_id: "customer_1",
        customer_id: "customer_1",
        provider_id: "provider_1",
        service_id: "svc_1",
        first_provider_response_at: null,
      },
    ],
    services: [{ id: "svc_1", user_id: "provider_1" }],
    chat_messages: [],
  })

  const result = await chatService.createChatMessage(
    supabase,
    { id: "provider_1", email: "provider@example.com" },
    { requestId: "req_1", message: "Hallo, ich kann morgen helfen." }
  )

  assert.equal(result.ok, true)
  const responseTimeWrite = supabase.writes.find(
    (write) => write.table === "requests" && write.op === "update"
  )
  assert.equal(responseTimeWrite.payload.first_provider_response_at, "2026-05-18T10:15:00.000Z")
})

test("customer can review only completed requests", async () => {
  const pendingSupabase = createFakeSupabase({
    requests: [{ id: "req_1", service_id: "svc_1", sender_id: "customer_1", status: "accepted" }],
  })

  const pending = await reviewService.createReview(
    pendingSupabase,
    { id: "customer_1", email: "customer@example.com" },
    {
      requestId: "req_1",
      serviceId: "svc_1",
      rating: 5,
      comment: "Top",
      proofUrls: ["https://example.com/proof.jpg"],
    }
  )

  assert.equal(pending.ok, false)
  assert.equal(pending.status, 400)

  const completedSupabase = createFakeSupabase({
    requests: [{ id: "req_1", service_id: "svc_1", sender_id: "customer_1", status: "completed" }],
    reviews: [],
    services: [{ id: "svc_1", user_id: "provider_1" }],
  })

  const completed = await reviewService.createReview(
    completedSupabase,
    { id: "customer_1", email: "customer@example.com" },
    {
      requestId: "req_1",
      serviceId: "svc_1",
      rating: 5,
      comment: "Top",
      proofUrls: ["https://example.com/proof.jpg"],
    }
  )

  assert.equal(completed.ok, true)
})

import test from "node:test"
import assert from "node:assert/strict"

const inboxService = await import("../services/inboxService.ts")

function fakeSupabase(seed) {
  const writes = []

  function filterRows(table, filters) {
    return (seed[table] ?? []).filter((row) =>
      filters.every((filter) => {
        if (filter.op === "eq") return row[filter.column] === filter.value
        if (filter.op === "neq") return row[filter.column] !== filter.value
        if (filter.op === "in") return filter.value.includes(row[filter.column])
        if (filter.op === "is") return row[filter.column] === filter.value
        return true
      })
    )
  }

  return {
    writes,
    from(table) {
      const filters = []
      const builder = {
        select() {
          return builder
        },
        eq(column, value) {
          filters.push({ op: "eq", column, value })
          return builder
        },
        neq(column, value) {
          filters.push({ op: "neq", column, value })
          return builder
        },
        in(column, value) {
          filters.push({ op: "in", column, value })
          return builder
        },
        is(column, value) {
          filters.push({ op: "is", column, value })
          return builder
        },
        order() {
          return builder
        },
        returns: async () => ({ data: filterRows(table, filters), error: null }),
        maybeSingle() {
          const row = filterRows(table, filters)[0] ?? null
          const result = { data: row, error: null }
          return {
            returns: async () => result,
            then(resolve) {
              resolve(result)
            },
          }
        },
        update(payload) {
          return {
            eq(column, value) {
              filters.push({ op: "eq", column, value })
              return this
            },
            is(column, value) {
              filters.push({ op: "is", column, value })
              const matched = filterRows(table, filters)
              writes.push({ table, op: "update", payload, matched })
              seed[table] = (seed[table] ?? []).map((row) =>
                matched.some((item) => item.id === row.id) ? { ...row, ...payload } : row
              )
              return Promise.resolve({ data: null, error: null })
            },
          }
        },
      }
      return builder
    },
  }
}

test("inbox shows customer and provider requests scoped to the user", async () => {
  const supabase = fakeSupabase({
    services: [
      { id: "svc_provider", user_id: "user_1", title: "Provider Service" },
      { id: "svc_other", user_id: "provider_2", title: "Other Service" },
    ],
    requests: [
      { id: "req_customer", service_id: "svc_other", sender_id: "user_1", status: "pending", created_at: "2026-05-18T10:00:00.000Z" },
      { id: "req_provider", service_id: "svc_provider", sender_id: "customer_2", status: "accepted", created_at: "2026-05-18T10:05:00.000Z" },
      { id: "req_foreign", service_id: "svc_other", sender_id: "someone_else", status: "pending", created_at: "2026-05-18T10:10:00.000Z" },
    ],
    chat_messages: [
      { id: "msg_1", request_id: "req_provider", sender_id: "customer_2", receiver_id: "user_1", body: "Hallo", message: "Hallo", read_at: null, created_at: "2026-05-18T10:06:00.000Z" },
    ],
    reviews: [],
  })

  const result = await inboxService.loadInboxData(supabase, { id: "user_1", email: "u@example.com" })

  assert.equal(result.ok, true)
  const ids = result.data.requests.map((request) => request.id).sort()
  assert.deepEqual(ids, ["req_customer", "req_provider"])
  assert.equal(result.data.requests.find((request) => request.id === "req_provider").unread_count, 1)
})

test("request detail hides foreign requests as not found", async () => {
  const supabase = fakeSupabase({
    services: [{ id: "svc_1", user_id: "provider_1", title: "Service" }],
    requests: [{ id: "req_1", service_id: "svc_1", sender_id: "customer_1", status: "pending" }],
    chat_messages: [],
    reviews: [],
  })

  const result = await inboxService.loadRequestDetail(supabase, { id: "stranger", email: "s@example.com" }, "req_1")

  assert.equal(result.ok, false)
  assert.equal(result.status, 404)
})

test("mark read updates only current receiver messages", async () => {
  const supabase = fakeSupabase({
    services: [{ id: "svc_1", user_id: "provider_1", title: "Service" }],
    requests: [{ id: "req_1", service_id: "svc_1", sender_id: "customer_1", provider_id: "provider_1", status: "pending" }],
    chat_messages: [
      { id: "msg_1", request_id: "req_1", sender_id: "customer_1", receiver_id: "provider_1", body: "A", message: "A", read_at: null, created_at: "2026-05-18T10:00:00.000Z" },
      { id: "msg_2", request_id: "req_1", sender_id: "provider_1", receiver_id: "customer_1", body: "B", message: "B", read_at: null, created_at: "2026-05-18T10:01:00.000Z" },
    ],
    reviews: [],
  })

  const result = await inboxService.markRequestMessagesRead(supabase, { id: "provider_1", email: "p@example.com" }, "req_1")

  assert.equal(result.ok, true)
  const write = supabase.writes.find((item) => item.table === "chat_messages")
  assert.equal(write.matched.length, 1)
  assert.equal(write.matched[0].id, "msg_1")
})

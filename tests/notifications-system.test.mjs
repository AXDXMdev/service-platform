import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

const notificationService = await import("../services/notificationService.ts")

function fakeSupabase(seed) {
  const writes = []

  function filterRows(table, filters) {
    return (seed[table] ?? []).filter((row) =>
      filters.every((filter) => {
        if (filter.op === "eq") return row[filter.column] === filter.value
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
        is(column, value) {
          filters.push({ op: "is", column, value })
          return builder
        },
        order() {
          return builder
        },
        limit() {
          return builder
        },
        returns: async () => ({ data: filterRows(table, filters), error: null }),
        maybeSingle() {
          const result = { data: filterRows(table, filters)[0] ?? null, error: null }
          return {
            then(resolve) {
              resolve(result)
            },
          }
        },
        insert(payload) {
          const item = Array.isArray(payload) ? payload[0] : payload
          const row = {
            id: `noti_${(seed.notifications ?? []).length + 1}`,
            created_at: "2026-05-18T12:00:00.000Z",
            read_at: null,
            ...item,
          }
          seed[table] = [...(seed[table] ?? []), row]
          writes.push({ table, op: "insert", payload: row })
          return {
            select() {
              return {
                single: async () => ({ data: row, error: null }),
              }
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
              seed[table] = (seed[table] ?? []).map((row) =>
                matched.some((item) => item.id === row.id) ? { ...row, ...payload } : row
              )
              writes.push({ table, op: "update", payload, matched })
              return Promise.resolve({ data: null, error: null })
            },
            select() {
              return {
                maybeSingle: async () => {
                  const matched = filterRows(table, filters)
                  const row = matched[0] ? { ...matched[0], ...payload } : null
                  if (row) {
                    seed[table] = (seed[table] ?? []).map((item) => (item.id === row.id ? row : item))
                  }
                  writes.push({ table, op: "update", payload, matched })
                  return { data: row ? { id: row.id } : null, error: null }
                },
              }
            },
          }
        },
      }
      return builder
    },
  }
}

test("user sees only own notifications and unread count is correct", async () => {
  const supabase = fakeSupabase({
    notifications: [
      { id: "n1", user_id: "user_1", type: "new_message", title: "A", body: "A", read_at: null, created_at: "2026-05-18T12:00:00.000Z" },
      { id: "n2", user_id: "user_1", type: "new_request", title: "B", body: "B", read_at: "2026-05-18T12:01:00.000Z", created_at: "2026-05-18T12:00:00.000Z" },
      { id: "n3", user_id: "user_2", type: "new_message", title: "C", body: "C", read_at: null, created_at: "2026-05-18T12:00:00.000Z" },
    ],
  })

  const result = await notificationService.listNotifications(supabase, "user_1")

  assert.equal(result.ok, true)
  assert.equal(result.data.notifications.length, 2)
  assert.equal(result.data.unreadCount, 1)
})

test("read all updates only own unread notifications", async () => {
  const supabase = fakeSupabase({
    notifications: [
      { id: "n1", user_id: "user_1", read_at: null },
      { id: "n2", user_id: "user_2", read_at: null },
    ],
  })

  const result = await notificationService.markAllNotificationsRead(supabase, "user_1")

  assert.equal(result.ok, true)
  const update = supabase.writes.find((write) => write.table === "notifications" && write.op === "update")
  assert.equal(update.matched.length, 1)
  assert.equal(update.matched[0].id, "n1")
})

test("new request notification is created for provider but not for self", async () => {
  const supabase = fakeSupabase({
    notifications: [],
    notification_preferences: [],
  })

  const created = await notificationService.createNotificationWithClient(supabase, {
    userId: "provider_1",
    actorId: "customer_1",
    type: "new_request",
    requestId: "req_1",
    serviceId: "svc_1",
    title: "Neue Anfrage erhalten",
    body: "Ein Kunde hat deinen Service angefragt.",
  })

  const skipped = await notificationService.createNotificationWithClient(supabase, {
    userId: "provider_1",
    actorId: "provider_1",
    type: "new_message",
    requestId: "req_1",
    title: "Neue Nachricht",
    body: "Self",
  })

  assert.equal(created.ok, true)
  assert.equal(skipped.skipped, "self_or_missing_recipient")
  assert.equal(supabase.writes.filter((write) => write.table === "notifications").length, 1)
})

test("request and chat services emit notification events", async () => {
  const requestServiceSource = await readFile(new URL("../services/requestService.ts", import.meta.url), "utf8")
  const chatServiceSource = await readFile(new URL("../services/chatService.ts", import.meta.url), "utf8")

  assert.match(requestServiceSource, /type:\s*"new_request"/)
  assert.match(requestServiceSource, /"request_accepted"/)
  assert.match(requestServiceSource, /"request_declined"/)
  assert.match(requestServiceSource, /"request_completed"/)
  assert.match(requestServiceSource, /type:\s*"review_available"/)
  assert.match(chatServiceSource, /type:\s*"new_message"/)
})

test("notifications migration keeps normal insert access closed", async () => {
  const sql = await readFile(new URL("../supabase/migrations/20260518_notifications_system.sql", import.meta.url), "utf8")

  assert.match(sql, /alter table public\.notifications enable row level security/i)
  assert.match(sql, /create policy "notifications_select_own"[\s\S]+for select/i)
  assert.match(sql, /create policy "notifications_update_read_own"[\s\S]+for update/i)
  assert.doesNotMatch(sql, /on public\.notifications[\s\S]{0,160}for\s+insert/i)
})

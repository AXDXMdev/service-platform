import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

const cronRoute = await import("../app/api/cron/trust-metrics-aggregation/route.ts")
const trustService = await import("../services/trustMetricsAggregationService.ts")
const trustMetricsMigrationUrl = new URL("../supabase/migrations/20260518_detail_page_trust_metrics.sql", import.meta.url)

async function readJson(response) {
  return response.json()
}

function cronRequest(secret) {
  return new Request("http://localhost/api/cron/trust-metrics-aggregation", {
    method: "POST",
    headers: secret ? { Authorization: `Bearer ${secret}` } : {},
  })
}

function fakeSupabase(seed) {
  const writes = []
  return {
    writes,
    from(table) {
      return {
        select() {
          return {
            returns: async () => {
              const value = seed[table]
              if (value instanceof Error) {
                return { data: null, error: { message: value.message } }
              }
              return { data: value ?? [], error: null }
            },
          }
        },
        upsert(payload) {
          writes.push({ table, op: "upsert", payload })
          return Promise.resolve({ data: null, error: seed.upsertError?.[table] ?? null })
        },
        update(payload) {
          return {
            in: async (_column, ids) => {
              writes.push({ table, op: "update", payload, ids })
              return { data: null, error: seed.updateError?.[table] ?? null }
            },
          }
        },
      }
    },
  }
}

test("trust metrics cron rejects missing cron secret", async () => {
  const handler = cronRoute.createTrustMetricsAggregationPostHandler({
    hasValidCronSecret: () => false,
    hasServiceRoleEnv: () => false,
    createAdminClient: () => null,
    aggregateTrustMetrics: async () => {
      throw new Error("should_not_run")
    },
  })

  const response = await handler(cronRequest())
  const payload = await readJson(response)
  assert.equal(response.status, 401)
  assert.equal(payload.error.code, "unauthorized")
})

test("trust metrics cron rejects wrong cron secret", async () => {
  const handler = cronRoute.createTrustMetricsAggregationPostHandler({
    hasValidCronSecret: () => false,
    hasServiceRoleEnv: () => true,
    createAdminClient: () => ({ kind: "fake-admin" }),
    aggregateTrustMetrics: async () => {
      throw new Error("should_not_run")
    },
  })

  const response = await handler(cronRequest("wrong"))
  assert.equal(response.status, 401)
})

test("trust metrics cron starts worker with valid cron secret", async () => {
  let called = false
  const handler = cronRoute.createTrustMetricsAggregationPostHandler({
    hasValidCronSecret: () => true,
    hasServiceRoleEnv: () => true,
    createAdminClient: () => ({ kind: "fake-admin" }),
    aggregateTrustMetrics: async () => {
      called = true
      return {
        ok: true,
        processedProviders: 1,
        processedServices: 2,
        skipped: 0,
        warnings: [],
      }
    },
  })

  const response = await handler(cronRequest("correct"))
  const payload = await readJson(response)
  assert.equal(response.status, 200)
  assert.equal(called, true)
  assert.equal(payload.data.processedProviders, 1)
  assert.equal(payload.data.processedServices, 2)
})

test("trust metrics aggregation tolerates missing optional tables", async () => {
  const supabase = fakeSupabase({
    services: [{ id: "svc_1", user_id: "provider_1", created_at: "2026-05-01T00:00:00.000Z" }],
    requests: new Error('relation "requests" does not exist'),
    chat_messages: new Error('relation "chat_messages" does not exist'),
    reviews: new Error('relation "reviews" does not exist'),
    provider_verification_requests: new Error('relation "provider_verification_requests" does not exist'),
    abuse_reports: new Error('relation "abuse_reports" does not exist'),
    favorites: new Error('relation "favorites" does not exist'),
  })

  const result = await trustService.aggregateTrustMetrics(supabase)

  assert.equal(result.ok, true)
  assert.equal(result.processedServices, 1)
  assert.equal(result.processedProviders, 1)
  assert.ok(result.warnings.length >= 1)

  const providerWrite = supabase.writes.find((item) => item.table === "provider_trust_profiles")
  assert.equal(providerWrite.payload.trust_score, null)
  assert.equal(providerWrite.payload.trust_score_available, false)
})

test("trust metrics aggregation uses real completed requests and reviews", async () => {
  const supabase = fakeSupabase({
    services: [{ id: "svc_1", user_id: "provider_1", created_at: "2026-05-01T00:00:00.000Z", is_verified: true }],
    requests: [
      {
        id: "req_1",
        service_id: "svc_1",
        sender_id: "customer_1",
        status: "completed",
        created_at: "2026-05-10T10:00:00.000Z",
        updated_at: "2026-05-10T12:00:00.000Z",
        finalized_at: "2026-05-10T12:00:00.000Z",
      },
      {
        id: "req_2",
        service_id: "svc_1",
        sender_id: "customer_1",
        status: "completed",
        created_at: "2026-05-11T10:00:00.000Z",
        updated_at: "2026-05-11T12:00:00.000Z",
        finalized_at: "2026-05-11T12:00:00.000Z",
      },
      {
        id: "req_3",
        service_id: "svc_1",
        sender_id: "customer_2",
        status: "pending",
        created_at: "2026-05-12T10:00:00.000Z",
        updated_at: "2026-05-12T10:00:00.000Z",
      },
    ],
    chat_messages: [
      { request_id: "req_1", sender_id: "provider_1", created_at: "2026-05-10T10:08:00.000Z" },
      { request_id: "req_2", sender_id: "provider_1", created_at: "2026-05-11T10:12:00.000Z" },
    ],
    reviews: [
      { id: "rev_1", request_id: "req_1", service_id: "svc_1", rating: 5, proof_validated: true },
      { id: "rev_2", request_id: "req_2", service_id: "svc_1", rating: 1, proof_validated: false },
    ],
    provider_verification_requests: [{ user_id: "provider_1", status: "approved" }],
    abuse_reports: [],
    favorites: [{ service_id: "svc_1" }],
  })

  const result = await trustService.aggregateTrustMetrics(supabase)
  assert.equal(result.ok, true)

  const serviceWrite = supabase.writes.find((item) => item.table === "service_engagement_metrics")
  assert.equal(serviceWrite.payload.requests_count, 3)
  assert.equal(serviceWrite.payload.answered_requests_count, 2)
  assert.equal(serviceWrite.payload.completed_requests_count, 2)
  assert.equal(serviceWrite.payload.review_count, 1)
  assert.equal(serviceWrite.payload.average_rating, 5)

  const providerWrite = supabase.writes.find((item) => item.table === "provider_trust_profiles")
  assert.equal(providerWrite.payload.completed_jobs_count, 2)
  assert.equal(providerWrite.payload.response_rate_percent, 67)
  assert.equal(providerWrite.payload.response_time_minutes, 10)
  assert.equal(providerWrite.payload.repeat_customer_rate_percent, 50)
  assert.equal(providerWrite.payload.trust_score_available, true)
})

test("trust metrics migration keeps RLS write access closed for normal users", async () => {
  const sql = await readFile(trustMetricsMigrationUrl, "utf8")

  for (const table of ["provider_trust_profiles", "service_engagement_metrics", "service_review_breakdowns"]) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, "i"))
    assert.doesNotMatch(sql, new RegExp(`on public\\.${table}[\\s\\S]{0,160}for\\s+(insert|update|delete|all)`, "i"))
  }

  assert.match(sql, /create policy "Public can read provider trust profiles"[\s\S]+for select/i)
  assert.match(sql, /create policy "Providers can read own trust profile"[\s\S]+for select/i)
  assert.match(sql, /create policy "Public can read service engagement metrics"[\s\S]+for select/i)
})

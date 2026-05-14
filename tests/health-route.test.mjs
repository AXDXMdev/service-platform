import test from "node:test"
import assert from "node:assert/strict"

const healthRoute = await import("../app/api/health/route.ts")

async function readJson(response) {
  return response.json()
}

test("health route reports development status when env is incomplete", async () => {
  const previousNodeEnv = process.env.NODE_ENV
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const previousAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const previousService = process.env.SUPABASE_SERVICE_ROLE_KEY
  const previousAdminPassword = process.env.ADMIN_PANEL_PASSWORD
  const previousAdminToken = process.env.ADMIN_PANEL_TOKEN

  process.env.NODE_ENV = "development"
  delete process.env.NEXT_PUBLIC_SUPABASE_URL
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  delete process.env.SUPABASE_SERVICE_ROLE_KEY
  delete process.env.ADMIN_PANEL_PASSWORD
  delete process.env.ADMIN_PANEL_TOKEN

  const response = await healthRoute.GET()
  const payload = await readJson(response)

  assert.equal(response.status, 200)
  assert.equal(payload.data.status, "development")
  assert.equal(payload.data.ok, true)

  process.env.NODE_ENV = previousNodeEnv
  process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = previousAnon
  process.env.SUPABASE_SERVICE_ROLE_KEY = previousService
  process.env.ADMIN_PANEL_PASSWORD = previousAdminPassword
  process.env.ADMIN_PANEL_TOKEN = previousAdminToken
})

test("health route reports degraded status in production when critical env is missing", async () => {
  const previousNodeEnv = process.env.NODE_ENV
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const previousAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const previousService = process.env.SUPABASE_SERVICE_ROLE_KEY
  const previousAdminPassword = process.env.ADMIN_PANEL_PASSWORD
  const previousAdminToken = process.env.ADMIN_PANEL_TOKEN

  process.env.NODE_ENV = "production"
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co"
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon"
  delete process.env.SUPABASE_SERVICE_ROLE_KEY
  process.env.ADMIN_PANEL_PASSWORD = "secret"
  process.env.ADMIN_PANEL_TOKEN = "token"

  const response = await healthRoute.GET()
  const payload = await readJson(response)

  assert.equal(response.status, 503)
  assert.equal(payload.data.status, "degraded")
  assert.equal(payload.data.ok, false)

  process.env.NODE_ENV = previousNodeEnv
  process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = previousAnon
  process.env.SUPABASE_SERVICE_ROLE_KEY = previousService
  process.env.ADMIN_PANEL_PASSWORD = previousAdminPassword
  process.env.ADMIN_PANEL_TOKEN = previousAdminToken
})

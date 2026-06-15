import test from "node:test"
import assert from "node:assert/strict"

const authCallbackRoute = await import("../app/auth/callback/route.ts")

function locationPath(response) {
  return new URL(response.headers.get("location")).pathname + new URL(response.headers.get("location")).search
}

test("auth callback verifies Supabase token_hash email links", async () => {
  let verifyInput = null
  const handler = authCallbackRoute.createAuthCallbackGetHandler({
    createClient: () => ({
      auth: {
        exchangeCodeForSession: async () => ({ error: null }),
        verifyOtp: async (input) => {
          verifyInput = input
          return { error: null }
        },
      },
    }),
  })

  const response = await handler(
    new Request("https://hilfinio.de/auth/callback?token_hash=token_123&type=email&next=/dashboard?tab=profile")
  )

  assert.equal(response.status, 307)
  assert.deepEqual(verifyInput, { token_hash: "token_123", type: "email" })
  assert.equal(locationPath(response), "/dashboard?tab=profile")
})

test("auth callback rejects token_hash links with unknown otp type", async () => {
  let verifyCalled = false
  const handler = authCallbackRoute.createAuthCallbackGetHandler({
    createClient: () => ({
      auth: {
        exchangeCodeForSession: async () => ({ error: null }),
        verifyOtp: async () => {
          verifyCalled = true
          return { error: null }
        },
      },
    }),
  })

  const response = await handler(
    new Request("https://hilfinio.de/auth/callback?token_hash=token_123&type=unknown")
  )

  assert.equal(verifyCalled, false)
  assert.equal(locationPath(response), "/login?error=auth_link_invalid")
})

test("auth callback keeps supporting Supabase code exchange links", async () => {
  let exchangedCode = null
  const handler = authCallbackRoute.createAuthCallbackGetHandler({
    createClient: () => ({
      auth: {
        exchangeCodeForSession: async (code) => {
          exchangedCode = code
          return { error: null }
        },
        verifyOtp: async () => ({ error: null }),
      },
    }),
  })

  const response = await handler(
    new Request("https://hilfinio.de/auth/callback?code=auth_code_123&next=/dashboard")
  )

  assert.equal(response.status, 307)
  assert.equal(exchangedCode, "auth_code_123")
  assert.equal(locationPath(response), "/dashboard")
})

test("auth callback sends missing or expired links to friendly login errors", async () => {
  const missingHandler = authCallbackRoute.createAuthCallbackGetHandler()
  const missingResponse = await missingHandler(new Request("https://hilfinio.de/auth/callback"))
  assert.equal(locationPath(missingResponse), "/login?error=auth_link_missing")

  const expiredHandler = authCallbackRoute.createAuthCallbackGetHandler({
    createClient: () => ({
      auth: {
        exchangeCodeForSession: async () => ({ error: null }),
        verifyOtp: async () => ({ error: new Error("expired") }),
      },
    }),
  })
  const expiredResponse = await expiredHandler(
    new Request("https://hilfinio.de/auth/callback?token_hash=old&type=email")
  )
  assert.equal(locationPath(expiredResponse), "/login?error=auth_link_expired")
})

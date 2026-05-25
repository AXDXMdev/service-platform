import test from "node:test"
import assert from "node:assert/strict"
import { NextRequest } from "next/server"

const { proxy } = await import("../proxy.ts")

test("admin role route stays reachable as JSON endpoint during login", () => {
  const request = new NextRequest("https://hilfinio.de/admin/role", {
    headers: { host: "hilfinio.de" },
  })

  const response = proxy(request)

  assert.notEqual(response.status, 307)
  assert.equal(response.headers.get("location"), null)
})

test("admin dashboard still redirects without admin session", () => {
  const previousPassword = process.env.ADMIN_PANEL_PASSWORD
  const previousToken = process.env.ADMIN_PANEL_TOKEN
  process.env.ADMIN_PANEL_PASSWORD = "very-secure-admin-password"
  process.env.ADMIN_PANEL_TOKEN = "very-secure-admin-session-token-with-enough-length"

  try {
    const request = new NextRequest("https://hilfinio.de/admin", {
      headers: { host: "hilfinio.de" },
    })

    const response = proxy(request)

    assert.equal(response.status, 307)
    assert.equal(response.headers.get("location"), "https://hilfinio.de/admin/login")
  } finally {
    if (previousPassword === undefined) delete process.env.ADMIN_PANEL_PASSWORD
    else process.env.ADMIN_PANEL_PASSWORD = previousPassword

    if (previousToken === undefined) delete process.env.ADMIN_PANEL_TOKEN
    else process.env.ADMIN_PANEL_TOKEN = previousToken
  }
})

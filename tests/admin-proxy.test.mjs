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
    for (const path of ["/admin", "/dashboard/admin"]) {
      const request = new NextRequest(`https://hilfinio.de${path}`, {
        headers: { host: "hilfinio.de" },
      })

      const response = proxy(request)

      assert.equal(response.status, 307)
      assert.equal(response.headers.get("location"), "https://hilfinio.de/admin/login")
    }
  } finally {
    if (previousPassword === undefined) delete process.env.ADMIN_PANEL_PASSWORD
    else process.env.ADMIN_PANEL_PASSWORD = previousPassword

    if (previousToken === undefined) delete process.env.ADMIN_PANEL_TOKEN
    else process.env.ADMIN_PANEL_TOKEN = previousToken
  }
})

test("closed beta gate redirects public pages without access cookie", () => {
  const previousCode = process.env.BETA_ACCESS_CODE
  const previousToken = process.env.BETA_ACCESS_TOKEN
  process.env.BETA_ACCESS_CODE = "stuttgart-beta"
  process.env.BETA_ACCESS_TOKEN = "long-random-cookie-token"

  try {
    const request = new NextRequest("https://hilfinio.de/services?q=cleaning", {
      headers: { host: "hilfinio.de" },
    })

    const response = proxy(request)

    assert.equal(response.status, 307)
    assert.equal(
      response.headers.get("location"),
      "https://hilfinio.de/beta?next=%2Fservices%3Fq%3Dcleaning"
    )
  } finally {
    if (previousCode === undefined) delete process.env.BETA_ACCESS_CODE
    else process.env.BETA_ACCESS_CODE = previousCode

    if (previousToken === undefined) delete process.env.BETA_ACCESS_TOKEN
    else process.env.BETA_ACCESS_TOKEN = previousToken
  }
})

test("closed beta gate allows public pages with access cookie", () => {
  const previousCode = process.env.BETA_ACCESS_CODE
  const previousToken = process.env.BETA_ACCESS_TOKEN
  process.env.BETA_ACCESS_CODE = "stuttgart-beta"
  process.env.BETA_ACCESS_TOKEN = "long-random-cookie-token"

  try {
    const request = new NextRequest("https://hilfinio.de/services", {
      headers: {
        cookie: "hilfinio_beta_access=long-random-cookie-token",
        host: "hilfinio.de",
      },
    })

    const response = proxy(request)

    assert.notEqual(response.status, 307)
    assert.equal(response.headers.get("location"), null)
  } finally {
    if (previousCode === undefined) delete process.env.BETA_ACCESS_CODE
    else process.env.BETA_ACCESS_CODE = previousCode

    if (previousToken === undefined) delete process.env.BETA_ACCESS_TOKEN
    else process.env.BETA_ACCESS_TOKEN = previousToken
  }
})

test("closed beta gate keeps waitlist and legal pages public", () => {
  const previousCode = process.env.BETA_ACCESS_CODE
  const previousToken = process.env.BETA_ACCESS_TOKEN
  process.env.BETA_ACCESS_CODE = "stuttgart-beta"
  process.env.BETA_ACCESS_TOKEN = "long-random-cookie-token"

  try {
    for (const path of ["/waitlist", "/impressum", "/datenschutz", "/agb"]) {
      const request = new NextRequest(`https://hilfinio.de${path}`, {
        headers: { host: "hilfinio.de" },
      })

      const response = proxy(request)

      assert.notEqual(response.status, 307, `${path} should stay public`)
      assert.equal(response.headers.get("location"), null)
    }
  } finally {
    if (previousCode === undefined) delete process.env.BETA_ACCESS_CODE
    else process.env.BETA_ACCESS_CODE = previousCode

    if (previousToken === undefined) delete process.env.BETA_ACCESS_TOKEN
    else process.env.BETA_ACCESS_TOKEN = previousToken
  }
})

test("closed beta gate does not block admin login protection", () => {
  const previousBetaCode = process.env.BETA_ACCESS_CODE
  const previousBetaToken = process.env.BETA_ACCESS_TOKEN
  const previousPassword = process.env.ADMIN_PANEL_PASSWORD
  const previousToken = process.env.ADMIN_PANEL_TOKEN
  process.env.BETA_ACCESS_CODE = "stuttgart-beta"
  process.env.BETA_ACCESS_TOKEN = "long-random-cookie-token"
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
    if (previousBetaCode === undefined) delete process.env.BETA_ACCESS_CODE
    else process.env.BETA_ACCESS_CODE = previousBetaCode

    if (previousBetaToken === undefined) delete process.env.BETA_ACCESS_TOKEN
    else process.env.BETA_ACCESS_TOKEN = previousBetaToken

    if (previousPassword === undefined) delete process.env.ADMIN_PANEL_PASSWORD
    else process.env.ADMIN_PANEL_PASSWORD = previousPassword

    if (previousToken === undefined) delete process.env.ADMIN_PANEL_TOKEN
    else process.env.ADMIN_PANEL_TOKEN = previousToken
  }
})

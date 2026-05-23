import test from "node:test"
import assert from "node:assert/strict"

const authRedirects = await import("../lib/authRedirects.ts")

test("production auth redirects always use hilfinio.de", () => {
  const url = authRedirects.getAuthRedirectUrl("/auth/callback?next=/dashboard", {
    NODE_ENV: "production",
    NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  })

  assert.equal(url, "https://hilfinio.de/auth/callback?next=/dashboard")
})

test("preview auth redirects use the Vercel preview URL", () => {
  const url = authRedirects.getAuthRedirectUrl("/auth/callback?next=/dashboard", {
    NODE_ENV: "production",
    VERCEL_ENV: "preview",
    VERCEL_URL: "service-platform-preview.vercel.app",
  })

  assert.equal(url, "https://service-platform-preview.vercel.app/auth/callback?next=/dashboard")
})

test("local auth redirects use localhost", () => {
  const url = authRedirects.getAuthRedirectUrl("/update-password", {
    NODE_ENV: "development",
  })

  assert.equal(url, "http://localhost:3000/update-password")
})

test("callback next path accepts only internal paths", () => {
  assert.equal(authRedirects.sanitizeAuthNextPath("/dashboard"), "/dashboard")
  assert.equal(authRedirects.sanitizeAuthNextPath("/dashboard?tab=requests"), "/dashboard?tab=requests")
  assert.equal(authRedirects.sanitizeAuthNextPath("https://evil.example"), "/dashboard")
  assert.equal(authRedirects.sanitizeAuthNextPath("//evil.example"), "/dashboard")
  assert.equal(authRedirects.sanitizeAuthNextPath("/%2f%2fevil.example"), "/dashboard")
  assert.equal(authRedirects.sanitizeAuthNextPath("/\\evil"), "/dashboard")
})

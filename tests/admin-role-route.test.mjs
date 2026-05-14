import test from "node:test"
import assert from "node:assert/strict"

const adminRoleRoute = await import("../app/admin/role/route.ts")

async function readJson(response) {
  return response.json()
}

test("admin role route requires bearer auth", async () => {
  const handler = adminRoleRoute.createAdminRoleGetHandler({
    hasSupabaseEnv: () => true,
    createPublicClient: () => ({ kind: "fake-public" }),
    logServerError: () => {},
  })

  const response = await handler(new Request("http://localhost/admin/role"))
  assert.equal(response.status, 401)
})

test("admin role route returns role from profile", async () => {
  const fakeSupabase = {
    auth: {
      getUser: async () => ({
        data: { user: { id: "user_1" } },
      }),
    },
    from() {
      return {
        select() {
          return {
            eq() {
              return {
                maybeSingle: async () => ({
                  data: { role: "admin" },
                  error: null,
                }),
              }
            },
          }
        },
      }
    },
  }

  const handler = adminRoleRoute.createAdminRoleGetHandler({
    hasSupabaseEnv: () => true,
    createPublicClient: () => fakeSupabase,
    logServerError: () => {},
  })

  const response = await handler(
    new Request("http://localhost/admin/role", {
      headers: { Authorization: "Bearer token" },
    })
  )
  const payload = await readJson(response)
  assert.equal(response.status, 200)
  assert.equal(payload.data.role, "admin")
})

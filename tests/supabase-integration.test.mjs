import assert from "node:assert/strict"
import test from "node:test"
import { randomUUID } from "node:crypto"
import { createClient } from "@supabase/supabase-js"

const providersRoute = await import("../app/api/providers/services/route.ts")
const requestsRoute = await import("../app/api/requests/route.ts")
const requestStatusRoute = await import("../app/api/requests/[id]/status/route.ts")
const chatRoute = await import("../app/api/chat/route.ts")
const favoritesRoute = await import("../app/api/favorites/route.ts")
const reviewsRoute = await import("../app/api/reviews/route.ts")

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function hasRealSupabaseIntegrationEnv() {
  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return false
  }

  const normalizedUrl = supabaseUrl.toLowerCase()
  const hasPlaceholderUrl =
    normalizedUrl.includes("example.supabase.co") ||
    normalizedUrl.includes("localhost") ||
    normalizedUrl.includes("127.0.0.1")
  const hasPlaceholderKeys = [supabaseAnonKey, supabaseServiceRoleKey].some((key) => key.startsWith("ci-"))

  return normalizedUrl.startsWith("https://") && normalizedUrl.endsWith(".supabase.co") && !hasPlaceholderUrl && !hasPlaceholderKeys
}

const hasIntegrationEnv = hasRealSupabaseIntegrationEnv()

const integrationUsers = {
  provider: {
    email: "hilfinio.integration.provider@example.com",
    role: "provider",
    fullName: "Hilfinio Integration Provider",
  },
  customer: {
    email: "hilfinio.integration.customer@example.com",
    role: "customer",
    fullName: "Hilfinio Integration Customer",
  },
  outsider: {
    email: "hilfinio.integration.outsider@example.com",
    role: "customer",
    fullName: "Hilfinio Integration Outsider",
  },
}

function createAdminClient() {
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function createPublicClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function jsonRequest(url, body, { method = "POST", token } = {}) {
  return new Request(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
}

async function readJson(response) {
  const payload = await response.json()
  return payload
}

async function findUserByEmail(admin, email) {
  let page = 1

  while (true) {
    const result = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (result.error) {
      throw new Error(`Supabase listUsers fehlgeschlagen: ${result.error.message}`)
    }

    const users = result.data?.users ?? []
    const found = users.find((user) => user.email?.toLowerCase() === email.toLowerCase())
    if (found) return found
    if (users.length < 200) return null
    page += 1
  }
}

async function ensureUser(admin, { email, role, fullName }) {
  const password = `Hilfinio-${randomUUID()}!`
  let user = await findUserByEmail(admin, email)

  if (!user) {
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { source: "integration-test" },
    })
    if (created.error || !created.data.user) {
      throw new Error(`Test-User ${email} konnte nicht erstellt werden: ${created.error?.message}`)
    }
    user = created.data.user
  } else {
    const updated = await admin.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
      user_metadata: { ...(user.user_metadata ?? {}), source: "integration-test" },
    })
    if (updated.error || !updated.data.user) {
      throw new Error(`Test-User ${email} konnte nicht aktualisiert werden: ${updated.error?.message}`)
    }
    user = updated.data.user
  }

  const profileUpsert = await admin.from("profiles").upsert(
    [
      {
        user_id: user.id,
        role,
        full_name: fullName,
      },
    ],
    { onConflict: "user_id" }
  )

  if (profileUpsert.error) {
    throw new Error(`Profil fuer ${email} konnte nicht vorbereitet werden: ${profileUpsert.error.message}`)
  }

  const client = createPublicClient()
  const signIn = await client.auth.signInWithPassword({ email, password })
  if (signIn.error || !signIn.data.session || !signIn.data.user) {
    throw new Error(`Test-Login fuer ${email} fehlgeschlagen: ${signIn.error?.message ?? "keine Session"}`)
  }

  return {
    client,
    user: signIn.data.user,
    accessToken: signIn.data.session.access_token,
  }
}

test(
  "supabase integration and RLS flows stay production-safe",
  { skip: !hasIntegrationEnv },
  async (t) => {
    const admin = createAdminClient()
    const provider = await ensureUser(admin, integrationUsers.provider)
    const customer = await ensureUser(admin, integrationUsers.customer)
    const outsider = await ensureUser(admin, integrationUsers.outsider)

    const cleanup = {
      requestIds: [],
      serviceIds: [],
      userIds: [provider.user.id, customer.user.id, outsider.user.id],
    }

    t.after(async () => {
      if (cleanup.requestIds.length > 0) {
        await admin.from("request_events").delete().in("request_id", cleanup.requestIds)
        await admin.from("chat_messages").delete().in("request_id", cleanup.requestIds)
        await admin.from("reviews").delete().in("request_id", cleanup.requestIds)
        await admin.from("requests").delete().in("id", cleanup.requestIds)
      }

      if (cleanup.serviceIds.length > 0) {
        await admin.from("favorites").delete().in("service_id", cleanup.serviceIds)
        await admin.from("services").delete().in("id", cleanup.serviceIds)
      }

      for (const userId of cleanup.userIds) {
        await admin.from("profiles").delete().eq("user_id", userId)
        await admin.auth.admin.deleteUser(userId)
      }
    })

    const runId = randomUUID().slice(0, 8)

    const serviceResponse = await providersRoute.POST(
      jsonRequest(
        "http://localhost/api/providers/services",
        {
          title: `Integration Service ${runId}`,
          description: "Sauberer Supabase/RLS-Integrationstest fuer Hilfinio.",
          providerName: "Integration Anbieter",
          providerBio: "Wird nur fuer automatisierte Tests genutzt.",
          city: "Stuttgart",
          district: "Mitte",
          yearsExperience: 4,
          serviceRadiusKm: 15,
          isVolunteer: false,
          supportsSignLanguage: false,
          textChatOnly: false,
          barrierFreeSupport: true,
          mediaUrls: [],
          availabilityDays: ["Mo", "Di"],
          availabilityNote: "Nach Terminabsprache",
        },
        { token: provider.accessToken }
      )
    )
    assert.equal(serviceResponse.status, 200)
    const servicePayload = await readJson(serviceResponse)
    const serviceId = servicePayload.data.id
    cleanup.serviceIds.push(serviceId)

    await t.test("service RLS blocks outsider updates", async () => {
      const hackedTitle = `Hacked ${runId}`

      const outsiderUpdate = await outsider.client
        .from("services")
        .update({ title: hackedTitle })
        .eq("id", serviceId)

      assert.equal(outsiderUpdate.error, null)

      const publicRead = await outsider.client.from("services").select("title").eq("id", serviceId).single()
      assert.equal(publicRead.error, null)
      assert.notEqual(publicRead.data?.title, hackedTitle)
    })

    const requestResponse = await requestsRoute.POST(
      jsonRequest(
        "http://localhost/api/requests",
        { serviceId, customerBudgetEur: 120 },
        { token: customer.accessToken }
      )
    )
    assert.equal(requestResponse.status, 200)
    const requestPayload = await readJson(requestResponse)
    const requestId = requestPayload.data.id
    cleanup.requestIds.push(requestId)

    await t.test("request visibility follows RLS for customer, provider and outsider", async () => {
      const customerRequest = await customer.client.from("requests").select("id,status").eq("id", requestId).single()
      assert.equal(customerRequest.error, null)
      assert.equal(customerRequest.data?.id, requestId)

      const providerRequest = await provider.client.from("requests").select("id,status").eq("id", requestId).single()
      assert.equal(providerRequest.error, null)
      assert.equal(providerRequest.data?.id, requestId)

      const outsiderRequest = await outsider.client
        .from("requests")
        .select("id,status")
        .eq("id", requestId)
      assert.equal(outsiderRequest.error, null)
      assert.equal((outsiderRequest.data ?? []).length, 0)
    })

    await t.test("outsider cannot patch request status and provider can accept", async () => {
      const outsiderStatus = await requestStatusRoute.PATCH(
        jsonRequest(
          `http://localhost/api/requests/${requestId}/status`,
          { nextStatus: "accepted" },
          { method: "PATCH", token: outsider.accessToken }
        ),
        { params: Promise.resolve({ id: requestId }) }
      )
      assert.ok([403, 404].includes(outsiderStatus.status))

      const providerStatus = await requestStatusRoute.PATCH(
        jsonRequest(
          `http://localhost/api/requests/${requestId}/status`,
          { nextStatus: "accepted", note: "Passt." },
          { method: "PATCH", token: provider.accessToken }
        ),
        { params: Promise.resolve({ id: requestId }) }
      )
      assert.equal(providerStatus.status, 200)
    })

    await t.test("chat messages stay restricted to related users", async () => {
      const customerChat = await chatRoute.POST(
        jsonRequest(
          "http://localhost/api/chat",
          { requestId, message: "Hallo, ich brauche noch einen Termin." },
          { token: customer.accessToken }
        )
      )
      assert.equal(customerChat.status, 200)

      const providerChat = await chatRoute.POST(
        jsonRequest(
          "http://localhost/api/chat",
          { requestId, message: "Klar, morgen um 10 Uhr passt." },
          { token: provider.accessToken }
        )
      )
      assert.equal(providerChat.status, 200)

      const outsiderChat = await chatRoute.POST(
        jsonRequest(
          "http://localhost/api/chat",
          { requestId, message: "Ich lese hier mit." },
          { token: outsider.accessToken }
        )
      )
      assert.ok([403, 404].includes(outsiderChat.status))

      const providerMessages = await provider.client
        .from("chat_messages")
        .select("id,message")
        .eq("request_id", requestId)
      assert.equal(providerMessages.error, null)
      assert.equal((providerMessages.data ?? []).length >= 2, true)

      const outsiderMessages = await outsider.client
        .from("chat_messages")
        .select("id,message")
        .eq("request_id", requestId)
      assert.equal(outsiderMessages.error, null)
      assert.equal((outsiderMessages.data ?? []).length, 0)
    })

    await t.test("favorites stay private per user", async () => {
      const addFavorite = await favoritesRoute.POST(
        jsonRequest("http://localhost/api/favorites", { serviceId }, { token: customer.accessToken })
      )
      assert.equal(addFavorite.status, 200)

      const customerFavorites = await customer.client
        .from("favorites")
        .select("id,service_id")
        .eq("service_id", serviceId)
      assert.equal(customerFavorites.error, null)
      assert.equal((customerFavorites.data ?? []).length, 1)

      const outsiderFavorites = await outsider.client
        .from("favorites")
        .select("id,service_id")
        .eq("service_id", serviceId)
      assert.equal(outsiderFavorites.error, null)
      assert.equal((outsiderFavorites.data ?? []).length, 0)

      const removeFavorite = await favoritesRoute.DELETE(
        jsonRequest("http://localhost/api/favorites", { serviceId }, { method: "DELETE", token: customer.accessToken })
      )
      assert.equal(removeFavorite.status, 200)
    })

    await t.test("review route allows the request owner and blocks outsiders", async () => {
      const outsiderReview = await reviewsRoute.POST(
        jsonRequest(
          "http://localhost/api/reviews",
          {
            requestId,
            serviceId,
            rating: 4,
            comment: "Nicht meine Anfrage.",
            proofLinks: ["https://example.com/proof-outsider.jpg"],
          },
          { token: outsider.accessToken }
        )
      )
      assert.ok([403, 404].includes(outsiderReview.status))

      const customerReview = await reviewsRoute.POST(
        jsonRequest(
          "http://localhost/api/reviews",
          {
            requestId,
            serviceId,
            rating: 5,
            comment: "Integrationstest erfolgreich.",
            proofLinks: ["https://example.com/proof-customer.jpg"],
          },
          { token: customer.accessToken }
        )
      )
      assert.equal(customerReview.status, 200)

      const reviewPayload = await readJson(customerReview)
      assert.equal(reviewPayload.data.request_id, requestId)
      assert.equal(reviewPayload.data.reviewer_id, customer.user.id)
    })
  }
)

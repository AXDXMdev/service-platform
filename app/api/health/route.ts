import { apiOk } from "@/lib/apiResponse"

function checkEnv(name: string, requiredInProduction = true) {
  const present = Boolean(process.env[name])
  return {
    name,
    present,
    requiredInProduction,
  }
}

function buildHealthSnapshot() {
  const envChecks = [
    checkEnv("NEXT_PUBLIC_SUPABASE_URL"),
    checkEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    checkEnv("SUPABASE_SERVICE_ROLE_KEY"),
    checkEnv("ADMIN_PANEL_PASSWORD"),
    checkEnv("ADMIN_PANEL_TOKEN"),
    checkEnv("NEXT_PUBLIC_SITE_URL", false),
  ]

  const criticalMissing = envChecks.filter(
    (item) => item.requiredInProduction && !item.present
  )

  const production = process.env.NODE_ENV === "production"
  const status =
    criticalMissing.length === 0 ? "ready" : production ? "degraded" : "development"

  return {
    ok: criticalMissing.length === 0 || !production,
    status,
    timestamp: new Date().toISOString(),
    runtime: process.env.NEXT_RUNTIME ?? "nodejs",
    environment: process.env.NODE_ENV ?? "development",
    checks: {
      env: envChecks,
    },
  }
}

export async function GET() {
  const snapshot = buildHealthSnapshot()
  return apiOk(snapshot, {
    status: snapshot.ok ? 200 : 503,
  })
}

export async function HEAD() {
  const snapshot = buildHealthSnapshot()
  return new Response(null, {
    status: snapshot.ok ? 200 : 503,
  })
}

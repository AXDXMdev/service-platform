import { z } from "zod"

const optionalUrl = z
  .string()
  .trim()
  .url()
  .optional()
  .or(z.literal(""))
  .transform((value) => value || null)

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().trim().optional().or(z.literal("")).transform((value) => value || null),
  NEXT_PUBLIC_SITE_URL: optionalUrl,
  NEXT_PUBLIC_GOOGLE_ADS_CLIENT: z.string().trim().optional().or(z.literal("")).transform((value) => value || null),
  NEXT_PUBLIC_SENTRY_DSN: optionalUrl,
})

const serverEnvSchema = publicEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().trim().optional().or(z.literal("")).transform((value) => value || null),
  ADMIN_PANEL_PASSWORD: z.string().trim().optional().or(z.literal("")).transform((value) => value || null),
  ADMIN_PANEL_TOKEN: z.string().trim().optional().or(z.literal("")).transform((value) => value || null),
  UPSTASH_REDIS_REST_URL: optionalUrl,
  UPSTASH_REDIS_REST_TOKEN: z.string().trim().optional().or(z.literal("")).transform((value) => value || null),
  SENTRY_DSN: optionalUrl,
  OBSERVABILITY_INGEST_URL: optionalUrl,
  OBSERVABILITY_INGEST_TOKEN: z.string().trim().optional().or(z.literal("")).transform((value) => value || null),
  CRON_SECRET: z.string().trim().optional().or(z.literal("")).transform((value) => value || null),
  UPLOAD_AV_SCAN_URL: optionalUrl,
  UPLOAD_AV_SCAN_TOKEN: z.string().trim().optional().or(z.literal("")).transform((value) => value || null),
  UPLOAD_IMAGE_SANITIZER_URL: optionalUrl,
  UPLOAD_IMAGE_SANITIZER_TOKEN: z.string().trim().optional().or(z.literal("")).transform((value) => value || null),
})

export type PublicEnv = z.infer<typeof publicEnvSchema>
export type ServerEnv = z.infer<typeof serverEnvSchema>

export function getPublicEnv(): PublicEnv {
  return publicEnvSchema.parse(process.env)
}

export function getServerEnv(): ServerEnv {
  return serverEnvSchema.parse(process.env)
}

export function getProductionReadinessIssues() {
  const env = getServerEnv()
  const issues: string[] = []

  if (!env.NEXT_PUBLIC_SUPABASE_URL) issues.push("NEXT_PUBLIC_SUPABASE_URL fehlt.")
  if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY) issues.push("NEXT_PUBLIC_SUPABASE_ANON_KEY fehlt.")
  if (!env.SUPABASE_SERVICE_ROLE_KEY) issues.push("SUPABASE_SERVICE_ROLE_KEY fehlt.")
  if (!env.ADMIN_PANEL_PASSWORD) issues.push("ADMIN_PANEL_PASSWORD fehlt.")
  if (!env.ADMIN_PANEL_TOKEN) issues.push("ADMIN_PANEL_TOKEN fehlt.")

  if (env.ADMIN_PANEL_PASSWORD && env.ADMIN_PANEL_PASSWORD.length < 16) {
    issues.push("ADMIN_PANEL_PASSWORD sollte mindestens 16 Zeichen lang sein.")
  }

  if (env.ADMIN_PANEL_TOKEN && env.ADMIN_PANEL_TOKEN.length < 32) {
    issues.push("ADMIN_PANEL_TOKEN sollte mindestens 32 Zeichen lang sein.")
  }

  if (env.UPSTASH_REDIS_REST_URL && !env.UPSTASH_REDIS_REST_TOKEN) {
    issues.push("UPSTASH_REDIS_REST_TOKEN fehlt fuer verteiltes Rate Limiting.")
  }

  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    issues.push("Verteiltes Rate Limiting ist nicht aktiv konfiguriert.")
  }

  if (!env.SENTRY_DSN && !env.NEXT_PUBLIC_SENTRY_DSN && !env.OBSERVABILITY_INGEST_URL) {
    issues.push("Externe Observability ist nicht aktiv konfiguriert.")
  }

  return issues
}

export function getOpenLaunchReadinessIssues() {
  const env = getServerEnv()
  const issues = [...getProductionReadinessIssues()]

  if (!env.NEXT_PUBLIC_SITE_URL || /localhost|127\.0\.0\.1/i.test(env.NEXT_PUBLIC_SITE_URL)) {
    issues.push("NEXT_PUBLIC_SITE_URL muss fuer Open Launch auf die finale HTTPS-Domain zeigen.")
  }

  if (!env.CRON_SECRET || env.CRON_SECRET.length < 32) {
    issues.push("CRON_SECRET fehlt oder ist zu kurz fuer Worker-/Cron-Endpunkte.")
  }

  if (!env.UPLOAD_AV_SCAN_URL) {
    issues.push("Upload-AV-Scan ist nicht konfiguriert.")
  }

  if (!env.UPLOAD_IMAGE_SANITIZER_URL) {
    issues.push("Image-Sanitizer/Metadata-Stripping ist nicht konfiguriert.")
  }

  return [...new Set(issues)]
}

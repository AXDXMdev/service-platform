import { readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import { execFileSync } from "node:child_process"

const root = process.cwd()
const tracked = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], {
  cwd: root,
  encoding: "utf8",
})
  .split("\n")
  .filter(Boolean)

const ignored = [
  /^mobile\/node_modules\//,
  /^node_modules\//,
  /^\.next\//,
  /^\.vercel\//,
  /^docs\/recordings\//,
  /package-lock\.json$/,
  /\.(png|jpg|jpeg|gif|webp|ico|mp4|webm|zip)$/i,
]

const patterns = [
  { name: "Supabase service role JWT", regex: /eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}/ },
  { name: "Sentry DSN", regex: /https:\/\/[a-f0-9]{16,}@[a-z0-9.-]+\.ingest\.[a-z0-9.-]+\/\d+/i },
  { name: "Upstash token", regex: /\b[A-Za-z0-9_-]{32,}:[A-Za-z0-9_-]{32,}\b/ },
  { name: "Assigned secret env", regex: /^\s*(SUPABASE_ACCESS_TOKEN|SUPABASE_SERVICE_ROLE_KEY|UPSTASH_REDIS_REST_TOKEN|SENTRY_DSN|ADMIN_PANEL_PASSWORD|ADMIN_PANEL_TOKEN|CRON_SECRET|VERCEL_TOKEN)=\S+/m },
]

const findings = []

for (const file of tracked) {
  if (ignored.some((pattern) => pattern.test(file))) continue
  const path = join(root, file)
  let stats
  try {
    stats = statSync(path)
  } catch {
    continue
  }
  if (!stats.isFile() || stats.size > 1024 * 1024) continue

  const content = readFileSync(path, "utf8")
  for (const pattern of patterns) {
    if (pattern.regex.test(content)) {
      findings.push(`${relative(root, path)}: ${pattern.name}`)
    }
  }
}

if (findings.length > 0) {
  console.error("Potential secrets found:")
  for (const finding of findings) console.error(`- ${finding}`)
  process.exit(1)
}

console.log("Secret scan passed")

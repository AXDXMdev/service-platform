import { apiOk } from "@/lib/apiResponse"
import { getOpenLaunchReadinessIssues } from "@/lib/env"

export async function GET() {
  const issues = getOpenLaunchReadinessIssues()
  const ready = issues.length === 0

  return apiOk(
    {
      ok: ready,
      status: ready ? "open_launch_ready" : "blocked",
      checkedAt: new Date().toISOString(),
      blockers: issues,
    },
    {
      status: ready ? 200 : 503,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  )
}

import { createServerSupabaseAdminClient } from "@/lib/serverSupabase"

type AdminClient = NonNullable<ReturnType<typeof createServerSupabaseAdminClient>>

export async function submitAbuseReport(
  admin: AdminClient,
  input: {
    reporterUserId: string | null
    contactEmail: string | null
    category: string
    targetUrl: string | null
    targetEntityId: string | null
    description: string
  }
) {
  return admin.from("abuse_reports").insert([
    {
      reporter_user_id: input.reporterUserId,
      contact_email: input.contactEmail,
      category: input.category,
      target_url: input.targetUrl,
      target_entity_id: input.targetEntityId,
      description: input.description,
      status: "open",
    },
  ])
}

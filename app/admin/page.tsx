import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { ADMIN_COOKIE, hasValidAdminCookie, isAdminConfigured } from "@/lib/adminSession"
import AdminCmsClient from "@/app/admin/AdminCmsClient"

export default async function AdminPage() {
  if (!isAdminConfigured()) {
    redirect("/admin/login?error=not-configured")
  }

  const store = await cookies()
  const cookieValue = store.get(ADMIN_COOKIE)?.value
  if (!hasValidAdminCookie(cookieValue)) {
    redirect("/admin/login")
  }

  return <AdminCmsClient />
}


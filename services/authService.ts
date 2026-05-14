import { requireAuthenticatedUser } from "@/lib/serverAuth"

export async function requireUserContext(request: Request) {
  return requireAuthenticatedUser(request)
}

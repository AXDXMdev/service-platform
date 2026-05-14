import { apiError, apiOk } from "@/lib/apiResponse"
import { requireUserContext } from "@/services/authService"
import { loadFavoritesData } from "@/services/favoritesReadService"

type FavoritesListRouteDeps = {
  requireUserContext: typeof requireUserContext
  loadFavoritesData: typeof loadFavoritesData
}

export function createFavoritesListGetHandler(deps: FavoritesListRouteDeps) {
  return async function GET(request: Request) {
    const auth = await deps.requireUserContext(request)
    if (auth.error || !auth.user || !auth.supabase) return auth.error

    const result = await deps.loadFavoritesData(auth.supabase, auth.user)
    if (!result.ok) {
      return apiError(result.status, "upstream_error", result.message)
    }

    return apiOk(result.data)
  }
}

export const GET = createFavoritesListGetHandler({
  requireUserContext,
  loadFavoritesData,
})

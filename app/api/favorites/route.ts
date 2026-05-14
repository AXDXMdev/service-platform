import { apiError, apiOk } from "@/lib/apiResponse"
import { requireUserContext } from "@/services/authService"
import { addFavorite, removeFavorite } from "@/services/userService"
import { validateFavoriteInput } from "@/services/validation"

type FavoriteRouteDeps = {
  requireUserContext: typeof requireUserContext
  addFavorite: typeof addFavorite
  removeFavorite: typeof removeFavorite
  validateFavoriteInput: typeof validateFavoriteInput
}

export function createFavoritesPostHandler(deps: FavoriteRouteDeps) {
  return async function POST(request: Request) {
    const auth = await deps.requireUserContext(request)
    if (auth.error || !auth.user || !auth.supabase) return auth.error

    const body = await request.json().catch(() => null)
    const parsed = deps.validateFavoriteInput(body)
    if (!parsed.ok) {
      return apiError(400, "bad_request", parsed.message)
    }

    const result = await deps.addFavorite(auth.supabase, auth.user, parsed.value)
    if (!result.ok) {
      const code =
        result.status === 403
          ? "forbidden"
          : result.status === 404
            ? "not_found"
            : "upstream_error"
      return apiError(result.status, code, result.message)
    }

    return apiOk(result.data)
  }
}

export function createFavoritesDeleteHandler(deps: FavoriteRouteDeps) {
  return async function DELETE(request: Request) {
    const auth = await deps.requireUserContext(request)
    if (auth.error || !auth.user || !auth.supabase) return auth.error

    const body = await request.json().catch(() => null)
    const parsed = deps.validateFavoriteInput(body)
    if (!parsed.ok) {
      return apiError(400, "bad_request", parsed.message)
    }

    const result = await deps.removeFavorite(auth.supabase, auth.user, parsed.value)
    if (!result.ok) {
      return apiError(result.status, "upstream_error", result.message)
    }

    return apiOk(result.data)
  }
}

const favoriteRouteDeps = {
  requireUserContext,
  addFavorite,
  removeFavorite,
  validateFavoriteInput,
}

export const POST = createFavoritesPostHandler(favoriteRouteDeps)
export const DELETE = createFavoritesDeleteHandler(favoriteRouteDeps)

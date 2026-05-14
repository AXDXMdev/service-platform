import { mockAsync } from "../api/client"
import { appSettings, customerProfile } from "../data/mockData"
import { supabase } from "../lib/supabase"

export async function getCurrentUserProfile() {
  if (supabase) {
    const userResult = await supabase.auth.getUser()
    const user = userResult.data.user

    if (!user) {
      return null
    }

    return {
      ...customerProfile,
      id: user.id,
      name:
        user.user_metadata?.full_name ??
        user.user_metadata?.name ??
        customerProfile.name,
      email: user.email ?? customerProfile.email,
    }
  }

  return mockAsync(customerProfile, 140)
}

export async function getAppSettings() {
  return mockAsync(appSettings, 120)
}

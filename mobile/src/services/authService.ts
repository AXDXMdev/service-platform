import { mockAsync, serviceMode } from "../api/client"
import { customerProfile } from "../data/mockData"
import { supabase } from "../lib/supabase"
import type { AuthDraft } from "../types"

export async function login(input: AuthDraft) {
  const email = input.email.trim()
  const password = input.password.trim()

  if (!email || !password) {
    throw new Error("Bitte E-Mail und Passwort eingeben.")
  }

  if (supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password,
    })

    if (error) {
      throw new Error(error.message)
    }

    return {
      ok: true,
      mode: serviceMode,
      user: {
        ...customerProfile,
        id: data.user.id,
        name:
          data.user.user_metadata?.full_name ??
          data.user.user_metadata?.name ??
          customerProfile.name,
        email: data.user.email ?? email,
      },
    }
  }

  return mockAsync(
    {
      ok: true,
      mode: serviceMode,
      user: {
        ...customerProfile,
        email,
      },
    },
    220
  )
}

export async function register(input: AuthDraft) {
  const email = input.email.trim()
  const password = input.password.trim()
  const displayName = input.displayName?.trim() ?? ""

  if (!email || !password || !displayName) {
    throw new Error("Bitte Name, E-Mail und Passwort ausfuellen.")
  }

  if (supabase) {
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password,
      options: {
        data: {
          full_name: displayName,
        },
      },
    })

    if (error) {
      throw new Error(error.message)
    }

    return {
      ok: true,
      mode: serviceMode,
      user: {
        ...customerProfile,
        id: data.user?.id ?? customerProfile.id,
        name: displayName,
        email,
      },
    }
  }

  return mockAsync(
    {
      ok: true,
      mode: serviceMode,
      user: {
        ...customerProfile,
        name: displayName,
        email,
      },
    },
    260
  )
}

export async function logout() {
  if (supabase) {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw new Error(error.message)
    }
    return { ok: true, mode: serviceMode }
  }

  return mockAsync({ ok: true, mode: serviceMode }, 100)
}

import { mockAsync } from "../api/client"
import { categories, providers } from "../data/mockData"
import { supabase } from "../lib/supabase"
import type { Provider } from "../types"

type ServiceRow = {
  id: string
  title: string
  description: string | null
  provider_name: string | null
  city: string | null
  district: string | null
  price_from_eur?: number | null
  provider_bio?: string | null
  years_experience?: number | null
  service_radius_km?: number | null
  availability_note?: string | null
  availability_days?: string[] | null
  is_verified?: boolean | null
  supports_sign_language?: boolean | null
  text_chat_only?: boolean | null
  barrier_free_support?: boolean | null
}

function inferCategoryId(service: ServiceRow) {
  const haystack = [service.title, service.description, service.provider_bio]
    .join(" ")
    .toLowerCase()

  if (/umzug|transport/.test(haystack)) return "moving"
  if (/garten|hecke|rasen/.test(haystack)) return "garden"
  if (/repar|handwerk|montage/.test(haystack)) return "repair"
  if (/hilfe|alltag|begleitung|senior/.test(haystack)) return "care"
  if (/digital|computer|website|it|technik/.test(haystack)) return "digital"
  return "cleaning"
}

function mapServiceRowToProvider(service: ServiceRow): Provider {
  const tags = [
    service.is_verified ? "Verifiziert" : null,
    service.barrier_free_support ? "Barrierearm" : null,
    service.supports_sign_language ? "Gebaerdensprache" : null,
    service.text_chat_only ? "Text-Chat" : null,
  ].filter((value): value is string => Boolean(value))

  return {
    id: service.id,
    name: service.provider_name ?? "Hilfinio Anbieter",
    categoryId: inferCategoryId(service),
    title: service.title,
    city: service.city ?? "Unbekannt",
    district: service.district ?? "",
    rating: 4.7,
    reviewCount: 0,
    priceFrom: service.price_from_eur ?? 0,
    verified: Boolean(service.is_verified),
    availability:
      service.availability_note ??
      (service.availability_days?.length ? service.availability_days.join(", ") : "Nach Vereinbarung"),
    description: service.description ?? "Beschreibung folgt.",
    tags: tags.length > 0 ? tags : ["Neu auf Hilfinio"],
    bio: service.provider_bio ?? "Profilinformationen werden noch vervollstaendigt.",
    responseTime: "Antwortzeit wird noch gemessen",
    serviceArea: service.service_radius_km
      ? `Umkreis ${service.service_radius_km} km`
      : [service.city, service.district].filter(Boolean).join(", "),
    languages: ["Deutsch"],
    completedJobs: service.years_experience ? service.years_experience * 12 : 0,
  }
}

export async function getCategories() {
  return mockAsync(categories, 140)
}

export async function searchProviders(query: string, categoryId?: string) {
  if (supabase) {
    const result = await supabase
      .from("services")
      .select(
        "id,title,description,provider_name,city,district,price_from_eur,provider_bio,years_experience,service_radius_km,availability_note,availability_days,is_verified,supports_sign_language,text_chat_only,barrier_free_support"
      )
      .limit(60)
      .returns<ServiceRow[]>()

    if (result.error) {
      throw new Error(result.error.message)
    }

    const rows = (result.data ?? []).map(mapServiceRowToProvider)
    const normalized = query.trim().toLowerCase()

    return rows.filter((provider) => {
      const matchesQuery =
        !normalized ||
        [
          provider.name,
          provider.title,
          provider.city,
          provider.district,
          provider.description,
          provider.bio,
          provider.serviceArea,
          provider.languages.join(" "),
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalized)

      const matchesCategory = !categoryId || provider.categoryId === categoryId

      return matchesQuery && matchesCategory
    })
  }

  const normalized = query.trim().toLowerCase()

  const results = providers.filter((provider) => {
    const matchesQuery =
      !normalized ||
      [
        provider.name,
        provider.title,
        provider.city,
        provider.district,
        provider.description,
        provider.bio,
        provider.serviceArea,
        provider.languages.join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized)

    const matchesCategory = !categoryId || provider.categoryId === categoryId

    return matchesQuery && matchesCategory
  })

  return mockAsync(results, 180)
}

export async function getProviderById(providerId: string) {
  if (supabase) {
    const result = await supabase
      .from("services")
      .select(
        "id,title,description,provider_name,city,district,price_from_eur,provider_bio,years_experience,service_radius_km,availability_note,availability_days,is_verified,supports_sign_language,text_chat_only,barrier_free_support"
      )
      .eq("id", providerId)
      .maybeSingle<ServiceRow>()

    if (result.error) {
      throw new Error(result.error.message)
    }

    return result.data ? mapServiceRowToProvider(result.data) : null
  }

  const provider = providers.find((item) => item.id === providerId) ?? null
  return mockAsync(provider, 120)
}

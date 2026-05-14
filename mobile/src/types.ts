export type Screen =
  | "onboarding"
  | "auth"
  | "home"
  | "serviceDetail"
  | "booking"
  | "providerProfile"
  | "customerProfile"
  | "support"
  | "settings"
  | "legal"

export type AuthMode = "login" | "register"

export type Category = {
  id: string
  label: string
  icon: string
}

export type Provider = {
  id: string
  name: string
  categoryId: string
  title: string
  city: string
  district: string
  rating: number
  reviewCount: number
  priceFrom: number
  verified: boolean
  availability: string
  description: string
  tags: string[]
  bio: string
  responseTime: string
  serviceArea: string
  languages: string[]
  completedJobs: number
}

export type BookingDraft = {
  providerId: string
  date: string
  budget: string
  message: string
}

export type AuthDraft = {
  email: string
  password: string
  displayName?: string
}

export type CustomerProfile = {
  id: string
  name: string
  email: string
  city: string
  favoritesCount: number
  requestCount: number
  verifiedPhone: boolean
}

export type SupportChannel = {
  id: string
  label: string
  description: string
  value: string
  availability: string
}

export type SupportDraft = {
  email: string
  topic: string
  message: string
}

export type LegalDocument = {
  id: string
  title: string
  summary: string
  body: string[]
}

export type AppSettings = {
  city: string
  language: string
  notificationsEnabled: boolean
  supportEmail: string
  privacyVersion: string
}

export type RequestSummary = {
  id: string
  providerName: string
  serviceTitle: string
  status: "pending" | "accepted" | "completed"
  dateLabel: string
}

export type ServiceMode = "mock" | "supabase"

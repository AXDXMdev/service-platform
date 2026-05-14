export type Service = {
  id: string
  title: string
  description: string | null
  created_at?: string | null
  provider_name?: string | null
  user_id?: string | null
  city?: string | null
  district?: string | null
  price_from_eur?: number | null
  provider_bio?: string | null
  years_experience?: number | null
  service_radius_km?: number | null
  approx_lat?: number | null
  approx_lng?: number | null
  supports_sign_language?: boolean | null
  text_chat_only?: boolean | null
  barrier_free_support?: boolean | null
  is_volunteer?: boolean | null
  is_verified?: boolean | null
  media_urls?: string[] | null
  availability_days?: string[] | null
  availability_note?: string | null
  is_premium?: boolean | null
  boost_until?: string | null
}

export type ServiceRequest = {
  id: string
  service_id: string
  sender_id: string | null
  sender_email: string | null
  status:
    | "pending"
    | "accepted"
    | "rejected"
    | "completed"
    | "cancelled"
    | "deleted"
    | null
  created_at?: string | null
  updated_at?: string | null
  deleted_at?: string | null
  finalized_at?: string | null
  customer_budget_eur?: number | null
  provider_offer_eur?: number | null
  final_price_eur?: number | null
}

export type RequestEvent = {
  id: string
  request_id: string
  event_type: string
  from_status: string | null
  to_status: string | null
  actor_id: string | null
  note: string | null
  created_at: string
}

export type Review = {
  id: string
  request_id: string
  service_id: string
  reviewer_id: string
  reviewee_id: string | null
  rating: number
  comment: string | null
  proof_image_urls?: string[] | null
  proof_validated?: boolean | null
  validated_by?: string | null
  validated_at?: string | null
  created_at: string
}

export type Favorite = {
  id: string
  user_id: string
  service_id: string
  created_at: string
}

export type ChatMessage = {
  id: string
  request_id: string
  sender_id: string
  message: string
  created_at: string
}

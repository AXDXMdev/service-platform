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
  email_verified?: boolean | null
  phone_verified?: boolean | null
  identity_verified?: boolean | null
  business_verified?: boolean | null
  is_top_rated?: boolean | null
  provider_avatar_url?: string | null
  provider_last_active_at?: string | null
  response_time_minutes?: number | null
  response_rate_percent?: number | null
  completed_jobs_count?: number | null
  repeat_customer_rate_percent?: number | null
  media_urls?: string[] | null
  availability_days?: string[] | null
  availability_note?: string | null
  is_premium?: boolean | null
  boost_until?: string | null
  is_active?: boolean | null
}

export type ServiceRequest = {
  id: string
  service_id: string
  sender_id: string | null
  sender_email: string | null
  status:
    | "pending"
    | "accepted"
    | "declined"
    | "rejected"
    | "completed"
    | "cancelled"
    | "deleted"
    | null
  created_at?: string | null
  updated_at?: string | null
  deleted_at?: string | null
  finalized_at?: string | null
  completed_at?: string | null
  cancelled_at?: string | null
  declined_at?: string | null
  first_provider_response_at?: string | null
  customer_id?: string | null
  provider_id?: string | null
  first_message?: string | null
  preferred_date?: string | null
  request_location?: string | null
  contact_preference?: string | null
  decline_reason?: string | null
  proof_validated?: boolean | null
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
  receiver_id?: string | null
  message: string
  body?: string | null
  read_at?: string | null
  system_event_type?: string | null
  created_at: string
}

export type NotificationType =
  | "new_request"
  | "new_message"
  | "request_accepted"
  | "request_declined"
  | "request_completed"
  | "review_available"

export type Notification = {
  id: string
  user_id: string
  type: NotificationType
  request_id: string | null
  service_id?: string | null
  actor_id?: string | null
  title: string
  body: string
  read_at?: string | null
  created_at: string
}

export type NotificationPreference = {
  user_id: string
  email_new_requests: boolean
  email_messages: boolean
  email_status_updates: boolean
  in_app_enabled: boolean
  updated_at: string
}

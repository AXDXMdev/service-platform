create table if not exists public.provider_trust_profiles (
  provider_id uuid primary key references auth.users(id) on delete cascade,
  email_verified boolean not null default false,
  phone_verified boolean not null default false,
  identity_verified boolean not null default false,
  business_verified boolean not null default false,
  is_top_rated boolean not null default false,
  provider_avatar_url text,
  last_active_at timestamptz,
  response_time_minutes integer,
  response_rate_percent integer,
  completed_jobs_count integer not null default 0,
  repeat_customer_rate_percent integer,
  trust_score integer,
  trust_score_available boolean not null default false,
  trust_score_basis jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint provider_trust_response_time_non_negative check (response_time_minutes is null or response_time_minutes >= 0),
  constraint provider_trust_response_rate_bounds check (response_rate_percent is null or response_rate_percent between 0 and 100),
  constraint provider_trust_repeat_rate_bounds check (repeat_customer_rate_percent is null or repeat_customer_rate_percent between 0 and 100),
  constraint provider_trust_score_bounds check (trust_score is null or trust_score between 0 and 100),
  constraint provider_trust_completed_jobs_non_negative check (completed_jobs_count >= 0)
);

alter table public.provider_trust_profiles
  add column if not exists trust_score integer,
  add column if not exists trust_score_available boolean not null default false,
  add column if not exists trust_score_basis jsonb not null default '{}'::jsonb;

create table if not exists public.service_engagement_metrics (
  service_id uuid primary key references public.services(id) on delete cascade,
  views_24h integer not null default 0,
  views_7d integer not null default 0,
  inquiries_7d integer not null default 0,
  favorites_count integer not null default 0,
  requests_count integer not null default 0,
  answered_requests_count integer not null default 0,
  completed_requests_count integer not null default 0,
  average_rating numeric(3,2),
  review_count integer not null default 0,
  last_inquiry_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint service_engagement_non_negative check (
    views_24h >= 0 and views_7d >= 0 and inquiries_7d >= 0 and favorites_count >= 0
  )
);

alter table public.service_engagement_metrics
  add column if not exists requests_count integer not null default 0,
  add column if not exists answered_requests_count integer not null default 0,
  add column if not exists completed_requests_count integer not null default 0,
  add column if not exists average_rating numeric(3,2),
  add column if not exists review_count integer not null default 0;

alter table public.services
  add column if not exists email_verified boolean,
  add column if not exists phone_verified boolean,
  add column if not exists identity_verified boolean,
  add column if not exists business_verified boolean,
  add column if not exists is_top_rated boolean,
  add column if not exists provider_avatar_url text,
  add column if not exists provider_last_active_at timestamptz,
  add column if not exists response_time_minutes integer,
  add column if not exists response_rate_percent integer,
  add column if not exists completed_jobs_count integer,
  add column if not exists repeat_customer_rate_percent integer;

create table if not exists public.service_review_breakdowns (
  review_id uuid primary key references public.reviews(id) on delete cascade,
  communication_rating smallint,
  quality_rating smallint,
  punctuality_rating smallint,
  value_rating smallint,
  ai_summary text,
  created_at timestamptz not null default now(),
  constraint service_review_breakdown_rating_bounds check (
    (communication_rating is null or communication_rating between 1 and 5)
    and (quality_rating is null or quality_rating between 1 and 5)
    and (punctuality_rating is null or punctuality_rating between 1 and 5)
    and (value_rating is null or value_rating between 1 and 5)
  )
);

alter table public.provider_trust_profiles enable row level security;
alter table public.service_engagement_metrics enable row level security;
alter table public.service_review_breakdowns enable row level security;

drop policy if exists "Public can read provider trust profiles" on public.provider_trust_profiles;
create policy "Public can read provider trust profiles"
  on public.provider_trust_profiles
  for select
  using (true);

drop policy if exists "Providers can read own trust profile" on public.provider_trust_profiles;
create policy "Providers can read own trust profile"
  on public.provider_trust_profiles
  for select
  using (provider_id = auth.uid());

drop policy if exists "Public can read service engagement metrics" on public.service_engagement_metrics;
create policy "Public can read service engagement metrics"
  on public.service_engagement_metrics
  for select
  using (true);

drop policy if exists "Public can read review breakdowns" on public.service_review_breakdowns;
create policy "Public can read review breakdowns"
  on public.service_review_breakdowns
  for select
  using (true);

create index if not exists provider_trust_profiles_top_rated_idx
  on public.provider_trust_profiles (is_top_rated, completed_jobs_count desc);

create index if not exists service_engagement_metrics_inquiries_idx
  on public.service_engagement_metrics (inquiries_7d desc, views_7d desc);

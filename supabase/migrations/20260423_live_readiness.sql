-- Hilfinio live-readiness migration
-- Date: 2026-04-23

create extension if not exists pgcrypto;

-- Profiles + roles
create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'customer' check (role in ('customer', 'provider', 'admin')),
  full_name text,
  verification_level text not null default 'none' check (verification_level in ('none', 'basic', 'verified', 'trusted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Service enrichment for accessibility, volunteer support and trust
alter table public.services
  add column if not exists city text,
  add column if not exists district text,
  add column if not exists provider_bio text,
  add column if not exists years_experience integer,
  add column if not exists service_radius_km integer,
  add column if not exists approx_lat double precision,
  add column if not exists approx_lng double precision,
  add column if not exists supports_sign_language boolean not null default false,
  add column if not exists text_chat_only boolean not null default false,
  add column if not exists barrier_free_support boolean not null default false,
  add column if not exists is_volunteer boolean not null default false,
  add column if not exists is_verified boolean not null default false;

-- Request lifecycle
alter table public.requests
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists deleted_at timestamptz,
  add column if not exists status text not null default 'pending',
  add column if not exists provider_note text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'requests'
      and column_name = 'status'
  ) then
    alter table public.requests drop constraint if exists requests_status_check;
    alter table public.requests
      add constraint requests_status_check
      check (status in ('pending', 'accepted', 'rejected', 'completed', 'cancelled', 'deleted'));
  end if;
end $$;

-- Request event history
create table if not exists public.request_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests (id) on delete cascade,
  event_type text not null,
  from_status text,
  to_status text,
  actor_id uuid references auth.users (id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_request_events_request_id on public.request_events (request_id);

-- Reviews
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.requests (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete cascade,
  reviewer_id uuid not null references auth.users (id) on delete cascade,
  reviewee_id uuid references auth.users (id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create index if not exists idx_reviews_service_id on public.reviews (service_id);
create index if not exists idx_reviews_reviewer_id on public.reviews (reviewer_id);

-- Pilot city waitlist
create table if not exists public.waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  city text not null,
  role text not null check (role in ('customer', 'provider', 'volunteer')),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_waitlist_entries_city on public.waitlist_entries (city);
create index if not exists idx_waitlist_entries_role on public.waitlist_entries (role);

-- Updated-at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_requests_updated_at on public.requests;
create trigger set_requests_updated_at
before update on public.requests
for each row execute function public.set_updated_at();

-- RLS
alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.requests enable row level security;
alter table public.request_events enable row level security;
alter table public.reviews enable row level security;
alter table public.waitlist_entries enable row level security;

-- Profiles policies
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles
for select
using (
  auth.uid() = user_id
  or exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "profiles_upsert_own" on public.profiles;
create policy "profiles_upsert_own"
on public.profiles
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Services policies
drop policy if exists "services_select_public" on public.services;
create policy "services_select_public"
on public.services
for select
using (true);

drop policy if exists "services_insert_owner_or_admin" on public.services;
create policy "services_insert_owner_or_admin"
on public.services
for insert
with check (
  auth.uid() = user_id
  or exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "services_update_owner_or_admin" on public.services;
create policy "services_update_owner_or_admin"
on public.services
for update
using (
  auth.uid() = user_id
  or exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid() and p.role = 'admin'
  )
)
with check (
  auth.uid() = user_id
  or exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "services_delete_owner_or_admin" on public.services;
create policy "services_delete_owner_or_admin"
on public.services
for delete
using (
  auth.uid() = user_id
  or exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid() and p.role = 'admin'
  )
);

-- Requests policies
drop policy if exists "requests_select_related_users" on public.requests;
create policy "requests_select_related_users"
on public.requests
for select
using (
  auth.uid() = sender_id
  or exists (
    select 1
    from public.services s
    where s.id = requests.service_id and s.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "requests_insert_sender_only" on public.requests;
create policy "requests_insert_sender_only"
on public.requests
for insert
with check (auth.uid() = sender_id);

drop policy if exists "requests_update_related_users" on public.requests;
create policy "requests_update_related_users"
on public.requests
for update
using (
  auth.uid() = sender_id
  or exists (
    select 1
    from public.services s
    where s.id = requests.service_id and s.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid() and p.role = 'admin'
  )
)
with check (
  auth.uid() = sender_id
  or exists (
    select 1
    from public.services s
    where s.id = requests.service_id and s.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid() and p.role = 'admin'
  )
);

-- Request events policies
drop policy if exists "request_events_select_related_users" on public.request_events;
create policy "request_events_select_related_users"
on public.request_events
for select
using (
  exists (
    select 1
    from public.requests r
    left join public.services s on s.id = r.service_id
    where r.id = request_events.request_id
      and (
        r.sender_id = auth.uid()
        or s.user_id = auth.uid()
      )
  )
  or exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "request_events_insert_related_users" on public.request_events;
create policy "request_events_insert_related_users"
on public.request_events
for insert
with check (
  actor_id = auth.uid()
  and (
    exists (
      select 1
      from public.requests r
      left join public.services s on s.id = r.service_id
      where r.id = request_events.request_id
        and (
          r.sender_id = auth.uid()
          or s.user_id = auth.uid()
        )
    )
    or exists (
      select 1
      from public.profiles p
      where p.user_id = auth.uid() and p.role = 'admin'
    )
  )
);

-- Reviews policies
drop policy if exists "reviews_select_public" on public.reviews;
create policy "reviews_select_public"
on public.reviews
for select
using (true);

drop policy if exists "reviews_insert_reviewer_only" on public.reviews;
create policy "reviews_insert_reviewer_only"
on public.reviews
for insert
with check (
  reviewer_id = auth.uid()
  and exists (
    select 1
    from public.requests r
    where r.id = reviews.request_id
      and r.service_id = reviews.service_id
      and r.sender_id = auth.uid()
      and r.status in ('accepted', 'completed')
  )
);

-- Waitlist policies
drop policy if exists "waitlist_insert_any_authenticated" on public.waitlist_entries;
create policy "waitlist_insert_any_authenticated"
on public.waitlist_entries
for insert
with check (true);

drop policy if exists "waitlist_select_admin_only" on public.waitlist_entries;
create policy "waitlist_select_admin_only"
on public.waitlist_entries
for select
using (
  exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid() and p.role = 'admin'
  )
);

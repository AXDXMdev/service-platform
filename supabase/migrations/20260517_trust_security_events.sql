-- Abuse, trust, reputation, and audit-log readiness.

create table if not exists public.security_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users (id) on delete set null,
  event_type text not null,
  severity text not null default 'info' check (severity in ('info', 'warning', 'critical')),
  route text,
  ip_hash text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_security_events_type_created
  on public.security_events (event_type, created_at desc);

create index if not exists idx_security_events_severity_created
  on public.security_events (severity, created_at desc);

alter table public.security_events enable row level security;

drop policy if exists "security_events_admin_only" on public.security_events;
create policy "security_events_admin_only"
on public.security_events
for all
using (public.is_admin_or_moderator())
with check (public.is_admin_or_moderator());

create table if not exists public.provider_reputation_scores (
  user_id uuid primary key references auth.users (id) on delete cascade,
  score integer not null default 35 check (score >= 0 and score <= 100),
  label text not null default 'new',
  completed_requests integer not null default 0,
  validated_reviews integer not null default 0,
  abuse_reports integer not null default 0,
  verification_bonus integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.provider_reputation_scores enable row level security;

drop policy if exists "provider_reputation_select_public" on public.provider_reputation_scores;
create policy "provider_reputation_select_public"
on public.provider_reputation_scores
for select
using (true);

drop policy if exists "provider_reputation_admin_write" on public.provider_reputation_scores;
create policy "provider_reputation_admin_write"
on public.provider_reputation_scores
for all
using (public.is_admin_or_moderator())
with check (public.is_admin_or_moderator());

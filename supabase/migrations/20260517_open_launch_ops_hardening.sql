-- Open-launch operations hardening for abuse metadata and upload worker safety.

alter table public.abuse_reports
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists idx_abuse_reports_metadata_spam_score
  on public.abuse_reports (((metadata->>'spamScore')::int))
  where metadata ? 'spamScore';

alter table public.upload_processing_jobs
  add column if not exists locked_at timestamptz,
  add column if not exists locked_by text;

create index if not exists idx_upload_processing_jobs_worker_queue
  on public.upload_processing_jobs (status, locked_at, created_at);

create table if not exists public.platform_incidents (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  severity text not null default 'warning' check (severity in ('info', 'warning', 'critical')),
  status text not null default 'open' check (status in ('open', 'acknowledged', 'resolved')),
  title text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  resolved_at timestamptz
);

alter table public.platform_incidents enable row level security;

drop policy if exists "platform_incidents_admin_only" on public.platform_incidents;
create policy "platform_incidents_admin_only"
on public.platform_incidents
for all
using (public.is_admin_or_moderator())
with check (public.is_admin_or_moderator());

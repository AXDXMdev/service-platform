-- Upload processing and observability readiness for Hilfinio.

create table if not exists public.upload_processing_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  bucket text not null check (bucket in ('service-media', 'site-assets')),
  object_path text not null,
  content_type text not null,
  file_size bigint not null check (file_size > 0),
  fingerprint text not null unique,
  status text not null default 'queued' check (status in ('queued', 'processing', 'completed', 'failed', 'quarantined', 'duplicate')),
  checks jsonb not null default '{}'::jsonb,
  thumbnail_path text,
  sanitized_path text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists idx_upload_processing_jobs_user_created
  on public.upload_processing_jobs (user_id, created_at desc);

create index if not exists idx_upload_processing_jobs_status_created
  on public.upload_processing_jobs (status, created_at desc);

alter table public.upload_processing_jobs enable row level security;

drop policy if exists "upload_processing_select_own_or_admin" on public.upload_processing_jobs;
create policy "upload_processing_select_own_or_admin"
on public.upload_processing_jobs
for select
using (auth.uid() = user_id or public.is_admin_or_moderator());

drop policy if exists "upload_processing_insert_own" on public.upload_processing_jobs;
create policy "upload_processing_insert_own"
on public.upload_processing_jobs
for insert
with check (auth.uid() = user_id or public.is_admin_or_moderator());

drop policy if exists "upload_processing_update_admin" on public.upload_processing_jobs;
create policy "upload_processing_update_admin"
on public.upload_processing_jobs
for update
using (public.is_admin_or_moderator())
with check (public.is_admin_or_moderator());

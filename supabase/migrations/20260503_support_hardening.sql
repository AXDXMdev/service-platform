-- Hilfinio support hardening
-- Date: 2026-05-03

alter table public.requests
  add column if not exists internal_notes text,
  add column if not exists assigned_to uuid references auth.users (id) on delete set null,
  add column if not exists priority text not null default 'normal';

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'requests'
      and column_name = 'priority'
  ) then
    alter table public.requests drop constraint if exists requests_priority_check;
    alter table public.requests
      add constraint requests_priority_check
      check (priority in ('low', 'normal', 'high', 'urgent'));
  end if;
end $$;

create index if not exists idx_requests_priority_created
on public.requests (priority, created_at desc);

create index if not exists idx_requests_assigned_to_created
on public.requests (assigned_to, created_at desc);

create table if not exists public.support_audit_events (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  event_type text not null,
  actor_id uuid references auth.users (id) on delete set null,
  previous_value jsonb,
  next_value jsonb,
  internal_note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_support_audit_events_entity
on public.support_audit_events (entity_type, entity_id, created_at desc);

create index if not exists idx_support_audit_events_actor
on public.support_audit_events (actor_id, created_at desc);

alter table public.support_audit_events enable row level security;

drop policy if exists "support_audit_select_admin_or_moderator" on public.support_audit_events;
create policy "support_audit_select_admin_or_moderator"
on public.support_audit_events
for select
using (public.is_admin_or_moderator());

drop policy if exists "support_audit_insert_admin_or_moderator" on public.support_audit_events;
create policy "support_audit_insert_admin_or_moderator"
on public.support_audit_events
for insert
with check (public.is_admin_or_moderator());

drop policy if exists "requests_support_update_admin_or_moderator" on public.requests;
create policy "requests_support_update_admin_or_moderator"
on public.requests
for update
using (public.is_admin_or_moderator())
with check (public.is_admin_or_moderator());

-- Hilfinio request dashboard hardening
-- Date: 2026-04-26

create extension if not exists pgcrypto;

-- Keep completed bookings queryable without depending on event history joins.
alter table public.requests
  add column if not exists finalized_at timestamptz;

create index if not exists idx_requests_service_status_created
on public.requests (service_id, status, created_at desc);

create index if not exists idx_requests_sender_status_created
on public.requests (sender_id, status, created_at desc);

create index if not exists idx_request_events_created_at
on public.request_events (created_at desc);

-- Make this migration safe even when the Admin-CMS foundation migration was not applied yet.
create or replace function public.is_admin_or_moderator()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role in ('admin', 'moderator')
  );
$$;

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
  or public.is_admin_or_moderator()
);

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
  or public.is_admin_or_moderator()
)
with check (
  auth.uid() = sender_id
  or exists (
    select 1
    from public.services s
    where s.id = requests.service_id and s.user_id = auth.uid()
  )
  or public.is_admin_or_moderator()
);

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
  or public.is_admin_or_moderator()
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
    or public.is_admin_or_moderator()
  )
);

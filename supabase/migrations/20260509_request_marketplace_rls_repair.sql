-- Hilfinio request / marketplace RLS repair
-- Re-applies critical marketplace tables and policies in case older migrations
-- were not fully executed in the target Supabase project.

create extension if not exists pgcrypto;

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, service_id)
);

create index if not exists idx_favorites_user_id on public.favorites (user_id);
create index if not exists idx_favorites_service_id on public.favorites (service_id);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_chat_messages_request_created
  on public.chat_messages (request_id, created_at desc);

alter table public.requests enable row level security;
alter table public.request_events enable row level security;
alter table public.favorites enable row level security;
alter table public.chat_messages enable row level security;

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
  and exists (
    select 1
    from public.requests r
    left join public.services s on s.id = r.service_id
    where r.id = request_events.request_id
      and (
        r.sender_id = auth.uid()
        or s.user_id = auth.uid()
      )
  )
);

drop policy if exists "favorites_select_own" on public.favorites;
create policy "favorites_select_own"
on public.favorites
for select
using (user_id = auth.uid());

drop policy if exists "favorites_insert_own" on public.favorites;
create policy "favorites_insert_own"
on public.favorites
for insert
with check (user_id = auth.uid());

drop policy if exists "favorites_delete_own" on public.favorites;
create policy "favorites_delete_own"
on public.favorites
for delete
using (user_id = auth.uid());

drop policy if exists "chat_messages_select_related_users" on public.chat_messages;
create policy "chat_messages_select_related_users"
on public.chat_messages
for select
using (
  exists (
    select 1
    from public.requests r
    left join public.services s on s.id = r.service_id
    where r.id = chat_messages.request_id
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

drop policy if exists "chat_messages_insert_related_users" on public.chat_messages;
create policy "chat_messages_insert_related_users"
on public.chat_messages
for insert
with check (
  sender_id = auth.uid()
  and exists (
    select 1
    from public.requests r
    left join public.services s on s.id = r.service_id
    where r.id = chat_messages.request_id
      and (
        r.sender_id = auth.uid()
        or s.user_id = auth.uid()
      )
  )
);

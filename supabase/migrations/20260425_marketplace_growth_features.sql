-- Hilfinio marketplace growth features
-- Date: 2026-04-25

-- Service availability + monetization basics
alter table public.services
  add column if not exists availability_days text[] not null default '{}',
  add column if not exists availability_note text,
  add column if not exists is_premium boolean not null default false,
  add column if not exists boost_until timestamptz;

-- Request pricing
alter table public.requests
  add column if not exists customer_budget_eur numeric(10,2),
  add column if not exists provider_offer_eur numeric(10,2),
  add column if not exists final_price_eur numeric(10,2);

-- Favorites
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, service_id)
);

create index if not exists idx_favorites_user_id on public.favorites (user_id);
create index if not exists idx_favorites_service_id on public.favorites (service_id);

-- Chat messages per request
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_chat_messages_request_created
  on public.chat_messages (request_id, created_at desc);

alter table public.favorites enable row level security;
alter table public.chat_messages enable row level security;

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
    select 1 from public.profiles p
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

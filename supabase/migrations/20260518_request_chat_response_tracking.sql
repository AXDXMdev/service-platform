-- Hilfinio request/chat response tracking foundation
-- Idempotent hardening for real inquiry, chat, completion and review eligibility metrics.

create extension if not exists pgcrypto;

alter table public.requests
  add column if not exists customer_id uuid references auth.users(id) on delete set null,
  add column if not exists provider_id uuid references auth.users(id) on delete set null,
  add column if not exists first_message text,
  add column if not exists preferred_date text,
  add column if not exists request_location text,
  add column if not exists contact_preference text,
  add column if not exists first_provider_response_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists declined_at timestamptz,
  add column if not exists decline_reason text,
  add column if not exists proof_validated boolean;

update public.requests
set customer_id = sender_id
where customer_id is null and sender_id is not null;

update public.requests r
set provider_id = s.user_id
from public.services s
where r.provider_id is null
  and r.service_id = s.id
  and s.user_id is not null;

do $$
declare
  constraint_row record;
begin
  for constraint_row in
    select conname
    from pg_constraint
    where conrelid = 'public.requests'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format('alter table public.requests drop constraint if exists %I', constraint_row.conname);
  end loop;
end $$;

alter table public.requests
  add constraint requests_status_check
  check (status in ('pending', 'accepted', 'declined', 'rejected', 'completed', 'cancelled', 'deleted'));

create index if not exists idx_requests_provider_status_created
  on public.requests (provider_id, status, created_at desc);

create index if not exists idx_requests_first_provider_response
  on public.requests (first_provider_response_at)
  where first_provider_response_at is not null;

alter table public.chat_messages
  add column if not exists receiver_id uuid references auth.users(id) on delete set null,
  add column if not exists body text,
  add column if not exists read_at timestamptz,
  add column if not exists system_event_type text;

update public.chat_messages
set body = message
where body is null and message is not null;

alter table public.chat_messages
  alter column body drop not null;

create index if not exists idx_chat_messages_receiver_read
  on public.chat_messages (receiver_id, read_at, created_at desc);

alter table public.requests enable row level security;
alter table public.chat_messages enable row level security;
alter table public.reviews enable row level security;

drop policy if exists "requests_select_related_users" on public.requests;
create policy "requests_select_related_users"
on public.requests
for select
using (
  auth.uid() = sender_id
  or auth.uid() = customer_id
  or auth.uid() = provider_id
  or exists (
    select 1
    from public.services s
    where s.id = requests.service_id and s.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid() and p.role in ('admin', 'moderator')
  )
);

drop policy if exists "requests_insert_sender_only" on public.requests;
create policy "requests_insert_sender_only"
on public.requests
for insert
with check (
  auth.uid() = sender_id
  and (customer_id is null or customer_id = auth.uid())
);

drop policy if exists "requests_update_related_users" on public.requests;
create policy "requests_update_related_users"
on public.requests
for update
using (
  auth.uid() = sender_id
  or auth.uid() = customer_id
  or auth.uid() = provider_id
  or exists (
    select 1
    from public.services s
    where s.id = requests.service_id and s.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid() and p.role in ('admin', 'moderator')
  )
)
with check (
  auth.uid() = sender_id
  or auth.uid() = customer_id
  or auth.uid() = provider_id
  or exists (
    select 1
    from public.services s
    where s.id = requests.service_id and s.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid() and p.role in ('admin', 'moderator')
  )
);

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
        or r.customer_id = auth.uid()
        or r.provider_id = auth.uid()
        or s.user_id = auth.uid()
      )
  )
  or exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid() and p.role in ('admin', 'moderator')
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
        or r.customer_id = auth.uid()
        or r.provider_id = auth.uid()
        or s.user_id = auth.uid()
      )
  )
);

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
      and (r.sender_id = auth.uid() or r.customer_id = auth.uid())
      and r.status = 'completed'
  )
);

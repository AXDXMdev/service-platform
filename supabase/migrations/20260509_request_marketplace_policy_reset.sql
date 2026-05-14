-- Hilfinio marketplace policy reset
-- Removes any legacy or accidentally permissive policies on request/chat/favorite flows
-- and re-creates the intended least-privilege policies.

do $$
declare
  policy_row record;
begin
  for policy_row in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'requests'
  loop
    execute format('drop policy if exists %I on public.requests', policy_row.policyname);
  end loop;

  for policy_row in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'request_events'
  loop
    execute format('drop policy if exists %I on public.request_events', policy_row.policyname);
  end loop;

  for policy_row in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'chat_messages'
  loop
    execute format('drop policy if exists %I on public.chat_messages', policy_row.policyname);
  end loop;

  for policy_row in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'favorites'
  loop
    execute format('drop policy if exists %I on public.favorites', policy_row.policyname);
  end loop;
end $$;

alter table public.requests enable row level security;
alter table public.request_events enable row level security;
alter table public.chat_messages enable row level security;
alter table public.favorites enable row level security;

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

create policy "requests_insert_sender_only"
on public.requests
for insert
with check (auth.uid() = sender_id);

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

create policy "favorites_select_own"
on public.favorites
for select
using (user_id = auth.uid());

create policy "favorites_insert_own"
on public.favorites
for insert
with check (user_id = auth.uid());

create policy "favorites_delete_own"
on public.favorites
for delete
using (user_id = auth.uid());

-- Hilfinio notifications foundation
-- In-app notifications with service-side writes and user-scoped reads.

create extension if not exists pgcrypto;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (
    type in (
      'new_request',
      'new_message',
      'request_accepted',
      'request_declined',
      'request_completed',
      'review_available'
    )
  ),
  request_id uuid references public.requests(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  actor_id uuid references auth.users(id) on delete set null,
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email_new_requests boolean not null default true,
  email_messages boolean not null default true,
  email_status_updates boolean not null default true,
  in_app_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_created
  on public.notifications (user_id, created_at desc);

create index if not exists idx_notifications_user_unread
  on public.notifications (user_id, read_at)
  where read_at is null;

create index if not exists idx_notifications_request
  on public.notifications (request_id, created_at desc);

alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
on public.notifications
for select
using (user_id = auth.uid());

drop policy if exists "notifications_update_read_own" on public.notifications;
create policy "notifications_update_read_own"
on public.notifications
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "notification_preferences_select_own" on public.notification_preferences;
create policy "notification_preferences_select_own"
on public.notification_preferences
for select
using (user_id = auth.uid());

drop policy if exists "notification_preferences_insert_own" on public.notification_preferences;
create policy "notification_preferences_insert_own"
on public.notification_preferences
for insert
with check (user_id = auth.uid());

drop policy if exists "notification_preferences_update_own" on public.notification_preferences;
create policy "notification_preferences_update_own"
on public.notification_preferences
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

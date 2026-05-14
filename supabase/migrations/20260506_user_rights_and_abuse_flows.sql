-- Hilfinio user-rights and abuse flows
-- Date: 2026-05-06

create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  email text,
  reason text,
  status text not null default 'pending',
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  processed_by uuid references auth.users (id) on delete set null,
  mode text not null default 'request'
);

do $$
begin
  alter table public.account_deletion_requests drop constraint if exists account_deletion_requests_status_check;
  alter table public.account_deletion_requests
    add constraint account_deletion_requests_status_check
    check (status in ('pending', 'processing', 'completed', 'failed', 'cancelled'));

  alter table public.account_deletion_requests drop constraint if exists account_deletion_requests_mode_check;
  alter table public.account_deletion_requests
    add constraint account_deletion_requests_mode_check
    check (mode in ('request', 'delete_now'));
exception
  when others then
    null;
end $$;

create index if not exists idx_account_deletion_requests_user
  on public.account_deletion_requests (user_id, requested_at desc);

create table if not exists public.abuse_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid references auth.users (id) on delete set null,
  contact_email text,
  category text not null,
  target_url text,
  target_entity_id text,
  description text not null,
  status text not null default 'open',
  internal_notes text,
  assigned_to uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  alter table public.abuse_reports drop constraint if exists abuse_reports_category_check;
  alter table public.abuse_reports
    add constraint abuse_reports_category_check
    check (category in ('illegal_content', 'fraud', 'harassment', 'privacy', 'other'));

  alter table public.abuse_reports drop constraint if exists abuse_reports_status_check;
  alter table public.abuse_reports
    add constraint abuse_reports_status_check
    check (status in ('open', 'reviewing', 'resolved', 'rejected'));
exception
  when others then
    null;
end $$;

create index if not exists idx_abuse_reports_status_created
  on public.abuse_reports (status, created_at desc);

drop trigger if exists set_abuse_reports_updated_at on public.abuse_reports;
create trigger set_abuse_reports_updated_at
before update on public.abuse_reports
for each row execute function public.set_updated_at();

alter table public.account_deletion_requests enable row level security;
alter table public.abuse_reports enable row level security;

drop policy if exists "account_deletion_select_own_or_admin" on public.account_deletion_requests;
create policy "account_deletion_select_own_or_admin"
on public.account_deletion_requests
for select
using (auth.uid() = user_id or public.is_admin_or_moderator());

drop policy if exists "account_deletion_insert_own" on public.account_deletion_requests;
create policy "account_deletion_insert_own"
on public.account_deletion_requests
for insert
with check (auth.uid() = user_id);

drop policy if exists "account_deletion_update_admin" on public.account_deletion_requests;
create policy "account_deletion_update_admin"
on public.account_deletion_requests
for update
using (public.is_admin_or_moderator())
with check (public.is_admin_or_moderator());

drop policy if exists "abuse_reports_select_admin" on public.abuse_reports;
create policy "abuse_reports_select_admin"
on public.abuse_reports
for select
using (public.is_admin_or_moderator());

drop policy if exists "abuse_reports_update_admin" on public.abuse_reports;
create policy "abuse_reports_update_admin"
on public.abuse_reports
for update
using (public.is_admin_or_moderator())
with check (public.is_admin_or_moderator());

-- Hilfinio trust extensions
-- Date: 2026-04-23

-- Provider verification requests
create table if not exists public.provider_verification_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  company_name text not null,
  contact_email text,
  city text not null,
  website text,
  proof_urls text[] not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists idx_provider_verification_requests_user_id
  on public.provider_verification_requests (user_id);
create index if not exists idx_provider_verification_requests_status
  on public.provider_verification_requests (status);

-- Review validation fields (proof-based moderation)
alter table public.reviews
  add column if not exists proof_image_urls text[] not null default '{}',
  add column if not exists proof_validated boolean not null default false,
  add column if not exists validated_by uuid references auth.users (id) on delete set null,
  add column if not exists validated_at timestamptz;

-- Ensure at least one proof URL per review
do $$
begin
  alter table public.reviews drop constraint if exists reviews_proof_image_urls_nonempty;
  alter table public.reviews
    add constraint reviews_proof_image_urls_nonempty
    check (coalesce(array_length(proof_image_urls, 1), 0) > 0);
exception
  when others then
    null;
end $$;

alter table public.provider_verification_requests enable row level security;

-- Allow provider to read and insert their own verification requests
drop policy if exists "provider_verification_select_own_or_admin" on public.provider_verification_requests;
create policy "provider_verification_select_own_or_admin"
on public.provider_verification_requests
for select
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "provider_verification_insert_own" on public.provider_verification_requests;
create policy "provider_verification_insert_own"
on public.provider_verification_requests
for insert
with check (user_id = auth.uid());

drop policy if exists "provider_verification_update_admin" on public.provider_verification_requests;
create policy "provider_verification_update_admin"
on public.provider_verification_requests
for update
using (
  exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid() and p.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid() and p.role = 'admin'
  )
);

-- Allow admin to update profiles for verification workflows
drop policy if exists "profiles_admin_update_any" on public.profiles;
create policy "profiles_admin_update_any"
on public.profiles
for update
using (
  auth.uid() = user_id
  or exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid() and p.role = 'admin'
  )
)
with check (
  auth.uid() = user_id
  or exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid() and p.role = 'admin'
  )
);

-- Reviews are public only after proof validation.
drop policy if exists "reviews_select_public" on public.reviews;
create policy "reviews_select_public"
on public.reviews
for select
using (
  proof_validated = true
  or reviewer_id = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid() and p.role = 'admin'
  )
);

-- Reviewer can insert only with proofs and after a completed/accepted request.
drop policy if exists "reviews_insert_reviewer_only" on public.reviews;
create policy "reviews_insert_reviewer_only"
on public.reviews
for insert
with check (
  reviewer_id = auth.uid()
  and coalesce(array_length(proof_image_urls, 1), 0) > 0
  and exists (
    select 1
    from public.requests r
    where r.id = reviews.request_id
      and r.service_id = reviews.service_id
      and r.sender_id = auth.uid()
      and r.status in ('accepted', 'completed')
  )
);

-- Only admins can validate moderation fields.
drop policy if exists "reviews_update_admin_only" on public.reviews;
create policy "reviews_update_admin_only"
on public.reviews
for update
using (
  exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid() and p.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "reviews_delete_admin_only" on public.reviews;
create policy "reviews_delete_admin_only"
on public.reviews
for delete
using (
  exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid() and p.role = 'admin'
  )
);

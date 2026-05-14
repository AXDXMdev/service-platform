-- Hilfinio legal launch hardening
-- Date: 2026-05-06

alter table public.waitlist_entries
  add column if not exists privacy_accepted_at timestamptz,
  add column if not exists marketing_opt_in boolean not null default false,
  add column if not exists marketing_opt_in_at timestamptz,
  add column if not exists consent_version text;

alter table public.provider_verification_requests
  add column if not exists privacy_accepted_at timestamptz,
  add column if not exists verification_disclaimer_accepted_at timestamptz,
  add column if not exists consent_version text;

create index if not exists idx_waitlist_entries_marketing_opt_in
  on public.waitlist_entries (marketing_opt_in);

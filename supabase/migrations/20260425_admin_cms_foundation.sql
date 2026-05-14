-- Hilfinio Admin CMS foundation
-- Date: 2026-04-25

create extension if not exists pgcrypto;

-- Expand roles: add moderator
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'role'
  ) then
    alter table public.profiles drop constraint if exists profiles_role_check;
    alter table public.profiles
      add constraint profiles_role_check
      check (role in ('customer', 'provider', 'admin', 'moderator'));
  end if;
end $$;

-- Profile enrichment for provider/admin management
alter table public.profiles
  add column if not exists profile_image_url text,
  add column if not exists bio text,
  add column if not exists city text,
  add column if not exists contact_email text,
  add column if not exists is_visible boolean not null default true;

-- Service management enrichment
alter table public.services
  add column if not exists price_from_eur numeric(10,2),
  add column if not exists is_active boolean not null default true,
  add column if not exists is_featured boolean not null default false;

-- Waitlist admin workflow
alter table public.waitlist_entries
  add column if not exists status text not null default 'new',
  add column if not exists reviewed_at timestamptz;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'waitlist_entries'
      and column_name = 'status'
  ) then
    alter table public.waitlist_entries drop constraint if exists waitlist_entries_status_check;
    alter table public.waitlist_entries
      add constraint waitlist_entries_status_check
      check (status in ('new', 'contacted', 'converted', 'archived'));
  end if;
end $$;

-- Admin CMS singleton site settings
create table if not exists public.site_settings (
  key text primary key default 'default',
  hero_title text,
  hero_subheadline text,
  hero_cta_find text,
  hero_cta_offer text,
  trust_badges text[] not null default '{}',
  pilot_cities text[] not null default '{}',
  notice_boxes text[] not null default '{}',
  default_theme_mode text not null default 'light' check (default_theme_mode in ('light', 'dark')),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table if not exists public.theme_settings (
  key text primary key default 'default',
  primary_color text not null default '#356fe3',
  secondary_color text not null default '#245ac0',
  background_color text not null default '#f3f6fb',
  button_color text not null default '#356fe3',
  text_color text not null default '#0e1726',
  border_radius integer not null default 10,
  logo_url text,
  hero_background_url text,
  card_style text not null default 'soft',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table if not exists public.homepage_sections (
  key text primary key,
  label text not null,
  enabled boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table if not exists public.site_content (
  key text primary key,
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table if not exists public.cms_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  icon text not null,
  description text not null default '',
  color text not null default '#356fe3',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_cms_categories_sort_order
  on public.cms_categories (sort_order, created_at desc);

-- Seed singleton rows if missing
insert into public.site_settings (key)
values ('default')
on conflict (key) do nothing;

insert into public.theme_settings (key)
values ('default')
on conflict (key) do nothing;

insert into public.homepage_sections (key, label, enabled, sort_order)
values
  ('hero', 'Hero', true, 10),
  ('featured_services', 'Service Highlights', true, 20),
  ('confidence', 'Vertrauen', true, 30),
  ('trust_cards', 'Trust Cards', true, 40),
  ('provider_cta', 'Anbieter CTA', true, 50)
on conflict (key) do nothing;

insert into public.site_content (key, content)
values
  (
    'footer',
    jsonb_build_object(
      'impressum_label', 'Impressum',
      'datenschutz_label', 'Datenschutz',
      'agb_label', 'AGB',
      'provider_verification_label', 'Anbieter-Verifizierung',
      'waitlist_label', 'Warteliste',
      'footer_text', 'Hilfinio verbindet Kunden und Anbieter sicher und transparent.'
    )
  ),
  (
    'faq',
    jsonb_build_object('title', 'FAQ', 'items', jsonb_build_array())
  ),
  (
    'help',
    jsonb_build_object('title', 'Hilfe', 'text', 'Wie koennen wir helfen?')
  ),
  (
    'accessibility',
    jsonb_build_object('title', 'Barrierefreiheit', 'text', 'Hilfinio ist auf inklusive Nutzung ausgelegt.')
  )
on conflict (key) do nothing;

insert into public.cms_categories (slug, name, icon, description, color, sort_order, is_active)
values
  ('cleaning', 'Reinigung', 'sparkles', 'Wohnungen, Bueros, Grundreinigung und Auszugshilfe.', '#356fe3', 10, true),
  ('repair', 'Reparatur', 'wrench', 'Handwerk, kleine Fixes, Montage und Installationen.', '#356fe3', 20, true),
  ('moving', 'Umzug', 'truck', 'Umzugshilfe, Tragen, Packen und Transport.', '#356fe3', 30, true),
  ('tutoring', 'Nachhilfe', 'book-open', 'Schule, Sprachen, Musik und Pruefungsvorbereitung.', '#356fe3', 40, true),
  ('wellness', 'Wellness', 'heart', 'Fitness, Beauty, Pflege und Coaching.', '#356fe3', 50, true),
  ('it', 'IT-Hilfe', 'cpu', 'Geraete, Software, Webseiten und Smart Home.', '#356fe3', 60, true),
  ('first-aid', 'Erste-Hilfe-Kurse', 'shield-plus', 'Erste Hilfe, Notfalltraining, Reanimation und Sicherheitskurse.', '#356fe3', 70, true),
  ('volunteer', 'Ehrenamtliche Hilfe', 'hand-heart', 'Einkaufshilfe, Alltagshilfe, Senioren- und Handicap-Unterstuetzung.', '#10b981', 80, true)
on conflict (slug) do nothing;

-- Keep updated_at consistent
drop trigger if exists set_cms_categories_updated_at on public.cms_categories;
create trigger set_cms_categories_updated_at
before update on public.cms_categories
for each row execute function public.set_updated_at();

drop trigger if exists set_site_settings_updated_at on public.site_settings;
create trigger set_site_settings_updated_at
before update on public.site_settings
for each row execute function public.set_updated_at();

drop trigger if exists set_theme_settings_updated_at on public.theme_settings;
create trigger set_theme_settings_updated_at
before update on public.theme_settings
for each row execute function public.set_updated_at();

drop trigger if exists set_homepage_sections_updated_at on public.homepage_sections;
create trigger set_homepage_sections_updated_at
before update on public.homepage_sections
for each row execute function public.set_updated_at();

drop trigger if exists set_site_content_updated_at on public.site_content;
create trigger set_site_content_updated_at
before update on public.site_content
for each row execute function public.set_updated_at();

-- Helper function for role checks
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

create or replace function public.is_admin_user()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'admin'
  );
$$;

alter table public.site_settings enable row level security;
alter table public.theme_settings enable row level security;
alter table public.homepage_sections enable row level security;
alter table public.site_content enable row level security;
alter table public.cms_categories enable row level security;

-- Public read for runtime rendering
drop policy if exists "site_settings_select_public" on public.site_settings;
create policy "site_settings_select_public"
on public.site_settings for select using (true);

drop policy if exists "theme_settings_select_public" on public.theme_settings;
create policy "theme_settings_select_public"
on public.theme_settings for select using (true);

drop policy if exists "homepage_sections_select_public" on public.homepage_sections;
create policy "homepage_sections_select_public"
on public.homepage_sections for select using (true);

drop policy if exists "site_content_select_public" on public.site_content;
create policy "site_content_select_public"
on public.site_content for select using (true);

drop policy if exists "cms_categories_select_public" on public.cms_categories;
create policy "cms_categories_select_public"
on public.cms_categories for select using (true);

-- Admin write
drop policy if exists "site_settings_write_admin_or_moderator" on public.site_settings;
create policy "site_settings_write_admin_or_moderator"
on public.site_settings
for all
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "theme_settings_write_admin_or_moderator" on public.theme_settings;
create policy "theme_settings_write_admin_or_moderator"
on public.theme_settings
for all
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "homepage_sections_write_admin_or_moderator" on public.homepage_sections;
create policy "homepage_sections_write_admin_or_moderator"
on public.homepage_sections
for all
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "site_content_write_admin_or_moderator" on public.site_content;
create policy "site_content_write_admin_or_moderator"
on public.site_content
for all
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "cms_categories_write_admin_or_moderator" on public.cms_categories;
create policy "cms_categories_write_admin_or_moderator"
on public.cms_categories
for all
using (public.is_admin_user())
with check (public.is_admin_user());

-- Expand provider/profile moderation permissions
drop policy if exists "profiles_admin_update_any" on public.profiles;
create policy "profiles_admin_update_any"
on public.profiles
for update
using (
  auth.uid() = user_id
  or public.is_admin_or_moderator()
)
with check (
  auth.uid() = user_id
  or public.is_admin_or_moderator()
);

-- Waitlist moderation
drop policy if exists "waitlist_update_admin_or_moderator" on public.waitlist_entries;
create policy "waitlist_update_admin_or_moderator"
on public.waitlist_entries
for update
using (public.is_admin_or_moderator())
with check (public.is_admin_or_moderator());

-- Service moderation permissions
drop policy if exists "services_update_owner_or_admin" on public.services;
create policy "services_update_owner_or_admin"
on public.services
for update
using (
  auth.uid() = user_id
  or public.is_admin_or_moderator()
)
with check (
  auth.uid() = user_id
  or public.is_admin_or_moderator()
);

drop policy if exists "services_delete_owner_or_admin" on public.services;
create policy "services_delete_owner_or_admin"
on public.services
for delete
using (
  auth.uid() = user_id
  or public.is_admin_or_moderator()
);

-- Storage bucket for CMS assets (logo/hero)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-assets',
  'site-assets',
  true,
  10485760,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/svg+xml'
  ]
)
on conflict (id) do nothing;

drop policy if exists "site_assets_public_read" on storage.objects;
create policy "site_assets_public_read"
on storage.objects
for select
using (bucket_id = 'site-assets');

drop policy if exists "site_assets_insert_admin_or_moderator" on storage.objects;
create policy "site_assets_insert_admin_or_moderator"
on storage.objects
for insert
with check (
  bucket_id = 'site-assets'
  and auth.role() = 'authenticated'
  and exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'admin'
  )
);

drop policy if exists "site_assets_update_admin_or_moderator" on storage.objects;
create policy "site_assets_update_admin_or_moderator"
on storage.objects
for update
using (
  bucket_id = 'site-assets'
  and auth.role() = 'authenticated'
  and exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'admin'
  )
)
with check (
  bucket_id = 'site-assets'
  and auth.role() = 'authenticated'
  and exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'admin'
  )
);

drop policy if exists "site_assets_delete_admin_or_moderator" on storage.objects;
create policy "site_assets_delete_admin_or_moderator"
on storage.objects
for delete
using (
  bucket_id = 'site-assets'
  and auth.role() = 'authenticated'
  and exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'admin'
  )
);

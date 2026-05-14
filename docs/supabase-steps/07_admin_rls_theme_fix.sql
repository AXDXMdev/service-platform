-- Hilfinio Admin CMS RLS + old dark theme repair
-- Run this whole file in the Supabase SQL Editor.
--
-- Important:
-- The logged-in Supabase user that edits the Admin CMS must have a row in
-- public.profiles with role = 'admin'. The separate ADMIN_PANEL_PASSWORD only
-- protects the Next.js admin page; Supabase RLS still checks auth.uid().
--
-- To find the user_id for an admin email:
-- select id, email from auth.users where email = 'DEINE-ADMIN-EMAIL';
--
-- To grant admin rights after checking the user is correct:
-- insert into public.profiles (user_id, role, verification_level)
-- values ('DEINE-USER-ID', 'admin', 'trusted')
-- on conflict (user_id) do update set role = 'admin', verification_level = 'trusted';

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'customer',
  full_name text,
  verification_level text not null default 'none',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists profile_image_url text,
  add column if not exists bio text,
  add column if not exists city text,
  add column if not exists contact_email text,
  add column if not exists is_visible boolean not null default true;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('customer', 'provider', 'admin', 'moderator'));

alter table public.profiles drop constraint if exists profiles_verification_level_check;
alter table public.profiles
  add constraint profiles_verification_level_check
  check (verification_level in ('none', 'basic', 'verified', 'trusted'));

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin_or_moderator()
returns boolean
language sql
stable
security definer
set search_path = public
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
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'admin'
  );
$$;

grant execute on function public.is_admin_or_moderator() to authenticated;
grant execute on function public.is_admin_user() to authenticated;

create table if not exists public.site_settings (
  key text primary key default 'default',
  hero_title text,
  hero_subheadline text,
  hero_cta_find text,
  hero_cta_offer text,
  trust_badges text[] not null default '{}',
  pilot_cities text[] not null default '{}',
  notice_boxes text[] not null default '{}',
  default_theme_mode text not null default 'light',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

alter table public.site_settings drop constraint if exists site_settings_default_theme_mode_check;
alter table public.site_settings
  add constraint site_settings_default_theme_mode_check
  check (default_theme_mode in ('light', 'dark'));

create table if not exists public.theme_settings (
  key text primary key default 'default',
  primary_color text not null default '#5b4bff',
  secondary_color text not null default '#4338ca',
  background_color text not null default '#f7f9ff',
  button_color text not null default '#5b4bff',
  text_color text not null default '#0e1726',
  text_secondary_color text not null default '#334155',
  text_muted_color text not null default '#64748b',
  card_background_color text not null default '#ffffff',
  card_text_color text not null default '#0f172a',
  border_radius integer not null default 10,
  text_logo text default 'Hilfinio',
  logo_url text,
  hero_background_url text,
  card_style text not null default 'soft',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

alter table public.theme_settings
  add column if not exists text_secondary_color text not null default '#334155',
  add column if not exists text_muted_color text not null default '#64748b',
  add column if not exists card_background_color text not null default '#ffffff',
  add column if not exists card_text_color text not null default '#0f172a',
  add column if not exists text_logo text default 'Hilfinio',
  add column if not exists logo_url text,
  add column if not exists hero_background_url text,
  add column if not exists updated_by uuid references auth.users(id) on delete set null;

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
  color text not null default '#5b4bff',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.page_contents (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text,
  content text,
  meta_title text,
  meta_description text,
  is_active boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
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

drop trigger if exists set_cms_categories_updated_at on public.cms_categories;
create trigger set_cms_categories_updated_at
before update on public.cms_categories
for each row execute function public.set_updated_at();

drop trigger if exists set_page_contents_updated_at on public.page_contents;
create trigger set_page_contents_updated_at
before update on public.page_contents
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.site_settings enable row level security;
alter table public.theme_settings enable row level security;
alter table public.homepage_sections enable row level security;
alter table public.site_content enable row level security;
alter table public.cms_categories enable row level security;
alter table public.page_contents enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles
for select
using (
  auth.uid() = user_id
  or public.is_admin_or_moderator()
);

drop policy if exists "profiles_upsert_own" on public.profiles;
create policy "profiles_upsert_own"
on public.profiles
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

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

drop policy if exists "page_contents_select_active_or_admin" on public.page_contents;
create policy "page_contents_select_active_or_admin"
on public.page_contents
for select
using (is_active = true or public.is_admin_or_moderator());

drop policy if exists "site_settings_write_admin_or_moderator" on public.site_settings;
create policy "site_settings_write_admin_or_moderator"
on public.site_settings
for all
using (public.is_admin_or_moderator())
with check (public.is_admin_or_moderator());

drop policy if exists "theme_settings_write_admin_or_moderator" on public.theme_settings;
create policy "theme_settings_write_admin_or_moderator"
on public.theme_settings
for all
using (public.is_admin_or_moderator())
with check (public.is_admin_or_moderator());

drop policy if exists "homepage_sections_write_admin_or_moderator" on public.homepage_sections;
create policy "homepage_sections_write_admin_or_moderator"
on public.homepage_sections
for all
using (public.is_admin_or_moderator())
with check (public.is_admin_or_moderator());

drop policy if exists "site_content_write_admin_or_moderator" on public.site_content;
create policy "site_content_write_admin_or_moderator"
on public.site_content
for all
using (public.is_admin_or_moderator())
with check (public.is_admin_or_moderator());

drop policy if exists "cms_categories_write_admin_or_moderator" on public.cms_categories;
create policy "cms_categories_write_admin_or_moderator"
on public.cms_categories
for all
using (public.is_admin_or_moderator())
with check (public.is_admin_or_moderator());

drop policy if exists "page_contents_write_admin" on public.page_contents;
create policy "page_contents_write_admin"
on public.page_contents
for all
using (public.is_admin_or_moderator())
with check (public.is_admin_or_moderator());

insert into public.site_settings
  (key, hero_title, hero_subheadline, hero_cta_find, hero_cta_offer, trust_badges, pilot_cities, notice_boxes, default_theme_mode)
values
  (
    'default',
    'Hilfinio - lokale Hilfe, die wirklich weiterhilft.',
    'Finde gepruefte Anbieter fuer Alltag, Zuhause und kleine Notfaelle. Schnell, lokal und verstaendlich.',
    'Dienstleister finden',
    'Service anbieten',
    array['Verifizierte Anbieter', 'Sichere Anfragen', 'Bewertungen', 'Datenschutzfreundlich'],
    array['Berlin', 'Hamburg', 'Muenchen', 'Stuttgart'],
    array['Pilotbetrieb aktiv'],
    'dark'
  )
on conflict (key) do update
set
  hero_title = excluded.hero_title,
  hero_subheadline = excluded.hero_subheadline,
  hero_cta_find = excluded.hero_cta_find,
  hero_cta_offer = excluded.hero_cta_offer,
  trust_badges = excluded.trust_badges,
  pilot_cities = excluded.pilot_cities,
  notice_boxes = excluded.notice_boxes,
  default_theme_mode = excluded.default_theme_mode,
  updated_at = now();

insert into public.theme_settings
  (
    key,
    primary_color,
    secondary_color,
    background_color,
    button_color,
    text_color,
    text_secondary_color,
    text_muted_color,
    card_background_color,
    card_text_color,
    border_radius,
    text_logo,
    card_style
  )
values
  (
    'default',
    '#5b4bff',
    '#4338ca',
    '#f7f9ff',
    '#5b4bff',
    '#0e1726',
    '#334155',
    '#64748b',
    '#ffffff',
    '#0f172a',
    10,
    'Hilfinio',
    'soft'
  )
on conflict (key) do update
set
  primary_color = excluded.primary_color,
  secondary_color = excluded.secondary_color,
  background_color = excluded.background_color,
  button_color = excluded.button_color,
  text_color = excluded.text_color,
  text_secondary_color = excluded.text_secondary_color,
  text_muted_color = excluded.text_muted_color,
  card_background_color = excluded.card_background_color,
  card_text_color = excluded.card_text_color,
  border_radius = excluded.border_radius,
  text_logo = excluded.text_logo,
  card_style = excluded.card_style,
  updated_at = now();

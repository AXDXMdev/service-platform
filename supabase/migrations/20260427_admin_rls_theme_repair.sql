-- Hilfinio Admin CMS RLS + old dark theme repair
-- Date: 2026-04-27

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

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles
for select
using (
  auth.uid() = user_id
  or public.is_admin_or_moderator()
);

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

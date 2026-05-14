-- Hilfinio theme readability + editable page content
-- Date: 2026-04-25

create extension if not exists pgcrypto;

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

alter table public.theme_settings
  add column if not exists text_secondary_color text not null default '#334155',
  add column if not exists text_muted_color text not null default '#64748b',
  add column if not exists card_background_color text not null default '#ffffff',
  add column if not exists card_text_color text not null default '#0f172a',
  add column if not exists text_logo text default 'Hilfinio';

update public.theme_settings
set
  text_color = coalesce(nullif(text_color, ''), '#0f172a'),
  text_secondary_color = coalesce(nullif(text_secondary_color, ''), '#334155'),
  text_muted_color = coalesce(nullif(text_muted_color, ''), '#64748b'),
  card_background_color = coalesce(nullif(card_background_color, ''), '#ffffff'),
  card_text_color = coalesce(nullif(card_text_color, ''), '#0f172a'),
  text_logo = coalesce(nullif(text_logo, ''), 'Hilfinio')
where key = 'default';

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

drop trigger if exists set_page_contents_updated_at on public.page_contents;
create trigger set_page_contents_updated_at
before update on public.page_contents
for each row execute function public.set_updated_at();

alter table public.page_contents enable row level security;

drop policy if exists "page_contents_select_active_or_admin" on public.page_contents;
create policy "page_contents_select_active_or_admin"
on public.page_contents
for select
using (is_active = true or public.is_admin_or_moderator());

drop policy if exists "page_contents_write_admin" on public.page_contents;
create policy "page_contents_write_admin"
on public.page_contents
for all
using (public.is_admin_user())
with check (public.is_admin_user());

insert into public.page_contents
  (slug, title, subtitle, content, meta_title, meta_description, is_active)
values
  ('home', 'Hilfinio', 'Finde passende Hilfe schnell, lokal und transparent.', 'Startseite mit Services, Vertrauenselementen und Pilotstaedten.', 'Hilfinio - Lokale Dienstleister finden', 'Hilfinio verbindet Kunden und Anbieter fuer lokale Dienstleistungen.', true),
  ('services', 'Dienstleistungen', 'Suche, filtere und vergleiche Anbieter in deiner Naehe.', 'Service-Uebersicht mit Kategorie-, Standort- und Sortierfiltern.', 'Dienstleistungen auf Hilfinio', 'Finde Reinigung, Reparatur, Umzug, Nachhilfe, IT-Hilfe und mehr.', true),
  ('impressum', 'Impressum', 'Rechtliche Angaben zum Betreiber von Hilfinio.', 'Bitte reale Betreiberangaben vor dem Go-Live eintragen.', 'Impressum - Hilfinio', 'Impressum und Kontaktangaben von Hilfinio.', true),
  ('datenschutz', 'Datenschutzerklaerung (DSGVO)', 'Informationen zur Verarbeitung personenbezogener Daten.', 'Diese Inhalte muessen vor dem Go-Live rechtlich final geprueft werden.', 'Datenschutz - Hilfinio', 'Datenschutzhinweise und DSGVO-Informationen fuer Hilfinio.', true),
  ('agb', 'Allgemeine Geschaeftsbedingungen (AGB)', 'Regeln fuer Kunden, Anbieter und die Nutzung der Plattform.', 'Diese Vorlage ersetzt keine rechtliche Beratung.', 'AGB - Hilfinio', 'Allgemeine Geschaeftsbedingungen fuer Hilfinio.', true),
  ('waitlist', 'Warteliste', 'Trage dich fuer den Pilotbetrieb in deiner Stadt ein.', 'Wartelisten-Eintraege helfen beim strukturierten Stadtstart.', 'Warteliste - Hilfinio', 'Trage dich in die Hilfinio Warteliste ein.', true),
  ('provider-verification', 'Anbieter-Verifizierung', 'Reiche Nachweise ein, damit dein Anbieterprofil verifiziert werden kann.', 'Verifizierung staerkt Vertrauen und Sichtbarkeit auf Hilfinio.', 'Anbieter-Verifizierung - Hilfinio', 'Anbieter koennen bei Hilfinio Nachweise zur Verifizierung einreichen.', true)
on conflict (slug) do nothing;

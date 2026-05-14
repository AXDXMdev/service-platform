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

create table if not exists public.theme_settings (
  key text primary key default 'default',
  primary_color text not null default '#356fe3',
  secondary_color text not null default '#245ac0',
  background_color text not null default '#f3f6fb',
  button_color text not null default '#356fe3',
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

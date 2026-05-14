create table if not exists public.homepage_sections (
  key text primary key,
  label text not null,
  is_enabled boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

alter table public.homepage_sections
  add column if not exists enabled boolean not null default true;

update public.homepage_sections
set enabled = is_enabled
where enabled is distinct from is_enabled;

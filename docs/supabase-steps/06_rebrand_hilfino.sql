update public.site_settings
set
  hero_title = 'Hilfinio - lokale Hilfe, die wirklich weiterhilft.',
  hero_subheadline = 'Finde gepruefte Anbieter fuer Alltag, Zuhause und kleine Notfaelle. Schnell, lokal und verstaendlich.',
  hero_cta_find = 'Dienstleister finden',
  hero_cta_offer = 'Service anbieten',
  trust_badges = array['Verifizierte Anbieter', 'Sichere Anfragen', 'Bewertungen', 'Datenschutzfreundlich'],
  pilot_cities = array['Berlin', 'Hamburg', 'Muenchen', 'Stuttgart'],
  default_theme_mode = 'dark',
  updated_at = now()
where key = 'default';

insert into public.site_settings
  (key, hero_title, hero_subheadline, hero_cta_find, hero_cta_offer, trust_badges, pilot_cities, notice_boxes, default_theme_mode)
select
  'default',
  'Hilfinio - lokale Hilfe, die wirklich weiterhilft.',
  'Finde gepruefte Anbieter fuer Alltag, Zuhause und kleine Notfaelle. Schnell, lokal und verstaendlich.',
  'Dienstleister finden',
  'Service anbieten',
  array['Verifizierte Anbieter', 'Sichere Anfragen', 'Bewertungen', 'Datenschutzfreundlich'],
  array['Berlin', 'Hamburg', 'Muenchen', 'Stuttgart'],
  array['Pilotbetrieb aktiv'],
  'dark'
where not exists (select 1 from public.site_settings where key = 'default');

update public.theme_settings
set
  primary_color = '#5b4bff',
  secondary_color = '#4338ca',
  button_color = '#5b4bff',
  background_color = '#f7f9ff',
  text_logo = 'Hilfinio',
  updated_at = now()
where key = 'default';

insert into public.theme_settings
  (key, primary_color, secondary_color, background_color, button_color, text_color, text_secondary_color, text_muted_color, card_background_color, card_text_color, border_radius, text_logo, card_style)
select
  'default', '#5b4bff', '#4338ca', '#f7f9ff', '#5b4bff', '#0e1726', '#334155', '#64748b', '#ffffff', '#0f172a', 10, 'Hilfinio', 'soft'
where not exists (select 1 from public.theme_settings where key = 'default');

update public.page_contents
set
  title = 'Hilfinio - lokale Hilfe, die wirklich weiterhilft.',
  subtitle = 'Finde passende Hilfe schnell, lokal und transparent.',
  content = 'Startseite mit Services, Vertrauenselementen und Pilotstaedten.',
  meta_title = 'Hilfinio - Lokale Dienstleister finden',
  meta_description = 'Hilfinio verbindet Kunden und Anbieter fuer lokale Dienstleistungen.',
  updated_at = now()
where slug = 'home';

update public.page_contents
set
  meta_title = replace(meta_title, 'Taskora', 'Hilfinio'),
  meta_description = replace(meta_description, 'Taskora', 'Hilfinio'),
  content = replace(content, 'Taskora', 'Hilfinio'),
  subtitle = replace(subtitle, 'Taskora', 'Hilfinio'),
  updated_at = now()
where slug <> 'home';

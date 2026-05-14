insert into public.site_settings
  (key, hero_title, hero_subheadline, hero_cta_find, hero_cta_offer, trust_badges, pilot_cities, notice_boxes, default_theme_mode)
values
  ('default', 'Hilfinio verbindet dich mit passenden Helfern vor Ort.', 'Finde geprüfte Anbieter für Alltag, Zuhause und Notfälle. Schnell, lokal und verständlich.', 'Dienstleister finden', 'Service anbieten', array['Verifizierte Anbieter', 'Sichere Anfragen', 'Bewertungen', 'Datenschutzfreundlich'], array['Berlin', 'Hamburg', 'Muenchen', 'Stuttgart'], array['Pilotbetrieb aktiv'], 'light')
on conflict (key) do nothing;

insert into public.theme_settings
  (key, primary_color, secondary_color, background_color, button_color, text_color, text_secondary_color, text_muted_color, card_background_color, card_text_color, border_radius, text_logo, card_style)
values
  ('default', '#356fe3', '#245ac0', '#f3f6fb', '#356fe3', '#0e1726', '#334155', '#64748b', '#ffffff', '#0f172a', 10, 'Hilfinio', 'soft')
on conflict (key) do nothing;

insert into public.homepage_sections (key, label, is_enabled, enabled, sort_order)
values
  ('hero', 'Hero-Bereich', true, true, 10),
  ('featured_services', 'Service-Karten', true, true, 20),
  ('confidence', 'Kategorien', true, true, 30),
  ('trust_cards', 'Trust-Karten', true, true, 40),
  ('provider_cta', 'Anbieter CTA', true, true, 50)
on conflict (key) do nothing;

insert into public.page_contents
  (slug, title, subtitle, content, meta_title, meta_description, is_active)
values
  ('home', 'Hilfinio', 'Finde passende Hilfe schnell, lokal und transparent.', 'Startseite mit Services, Vertrauenselementen und Pilotstaedten.', 'Hilfinio - Lokale Dienstleister finden', 'Hilfinio verbindet Kunden und Anbieter fuer lokale Dienstleistungen.', true),
  ('services', 'Dienstleistungen', 'Suche, filtere und vergleiche Anbieter in deiner Naehe.', 'Service-Uebersicht mit Kategorie-, Standort- und Sortierfiltern.', 'Dienstleistungen auf Hilfinio', 'Finde Reinigung, Reparatur, Umzug, Nachhilfe, IT-Hilfe und mehr.', true),
  ('provider-verification', 'Anbieter-Verifizierung', 'Reiche Nachweise ein, damit dein Anbieterprofil verifiziert werden kann.', 'Verifizierung staerkt Vertrauen und Sichtbarkeit auf Hilfinio.', 'Anbieter-Verifizierung - Hilfinio', 'Anbieter koennen bei Hilfinio Nachweise zur Verifizierung einreichen.', true)
on conflict (slug) do nothing;

-- Hilfinio provider media uploads
-- Date: 2026-04-25

alter table public.services
  add column if not exists media_urls text[] not null default '{}';

-- Public bucket for provider work examples (photos/videos)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'service-media',
  'service-media',
  true,
  52428800,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]
)
on conflict (id) do nothing;

drop policy if exists "service_media_public_read" on storage.objects;
create policy "service_media_public_read"
on storage.objects
for select
using (bucket_id = 'service-media');

drop policy if exists "service_media_insert_own_folder" on storage.objects;
create policy "service_media_insert_own_folder"
on storage.objects
for insert
with check (
  bucket_id = 'service-media'
  and auth.role() = 'authenticated'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "service_media_update_own_folder" on storage.objects;
create policy "service_media_update_own_folder"
on storage.objects
for update
using (
  bucket_id = 'service-media'
  and auth.role() = 'authenticated'
  and split_part(name, '/', 1) = auth.uid()::text
)
with check (
  bucket_id = 'service-media'
  and auth.role() = 'authenticated'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "service_media_delete_own_folder" on storage.objects;
create policy "service_media_delete_own_folder"
on storage.objects
for delete
using (
  bucket_id = 'service-media'
  and auth.role() = 'authenticated'
  and split_part(name, '/', 1) = auth.uid()::text
);

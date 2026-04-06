-- =====================
-- VoiceSOP — Storage Policies
-- Run after schema.sql in Supabase SQL Editor.
-- =====================

-- 1. Create the 'audio-recordings' bucket (PRIVATE — use signed URLs)
insert into storage.buckets (id, name, public)
values ('audio-recordings', 'audio-recordings', false)
on conflict (id) do update set public = false;

-- 2. Policies

-- Authenticated users can upload audio to their own folder (enforces user_id prefix)
drop policy if exists "Authenticated users can upload audio" on storage.objects;
create policy "Authenticated users can upload audio"
on storage.objects for insert
with check (
  bucket_id = 'audio-recordings'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can only read their own audio files
drop policy if exists "Public can view audio" on storage.objects;
drop policy if exists "Users can view own audio" on storage.objects;
create policy "Users can view own audio"
on storage.objects for select
using (
  bucket_id = 'audio-recordings'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own audio
drop policy if exists "Users can update own audio" on storage.objects;
create policy "Users can update own audio"
on storage.objects for update
using ( bucket_id = 'audio-recordings' and auth.uid() = owner );

-- Users can delete their own audio
drop policy if exists "Users can delete own audio" on storage.objects;
create policy "Users can delete own audio"
on storage.objects for delete
using ( bucket_id = 'audio-recordings' and auth.uid() = owner );

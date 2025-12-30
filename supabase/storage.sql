-- Enable the storage extension if not already enabled (usually enabled by default)
-- create extension if not exists "storage" schema "extensions";

-- 1. Create the 'audio-recordings' bucket
-- We use "insert into" because there isn't a "create bucket" command in standard SQL for Supabase Storage
insert into storage.buckets (id, name, public)
values ('audio-recordings', 'audio-recordings', true)
on conflict (id) do nothing;

-- 2. Set up Security Policies for the bucket

-- Allow Authenticated users to upload files
drop policy if exists "Authenticated users can upload audio" on storage.objects;
create policy "Authenticated users can upload audio"
on storage.objects for insert
with check (
  bucket_id = 'audio-recordings' 
  and auth.role() = 'authenticated'
);

-- Allow Users to view their own files (OR public if you prefer)
-- If public=true above, technically anyone can read if they have the URL.
-- But we can restrict "select" if valuable. For now, let's allow public read for simplicity of the prototype.
drop policy if exists "Public can view audio" on storage.objects;
create policy "Public can view audio"
on storage.objects for select
using ( bucket_id = 'audio-recordings' );

-- (Optional) Allow users to update/delete their own files
drop policy if exists "Users can update own audio" on storage.objects;
create policy "Users can update own audio"
on storage.objects for update
using ( bucket_id = 'audio-recordings' and auth.uid() = owner );

drop policy if exists "Users can delete own audio" on storage.objects;
create policy "Users can delete own audio"
on storage.objects for delete
using ( bucket_id = 'audio-recordings' and auth.uid() = owner );

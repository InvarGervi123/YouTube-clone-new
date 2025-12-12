-- Run this in Supabase SQL Editor

create extension if not exists "pgcrypto";

-- Profiles (for roles + banning)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('user','admin')),
  banned boolean not null default false,
  created_at timestamptz not null default now()
);

-- Create profile row on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Helper functions
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
as $$
  select exists(
    select 1 from public.profiles p
    where p.id = uid and p.role = 'admin' and p.banned = false
  );
$$;

create or replace function public.is_banned(uid uuid)
returns boolean
language sql
stable
as $$
  select coalesce((select p.banned from public.profiles p where p.id = uid), false);
$$;

alter table public.profiles enable row level security;

-- Users can read their own profile; admins can read all
drop policy if exists "Profiles: read own or admin" on public.profiles;
create policy "Profiles: read own or admin"
on public.profiles
for select
using (auth.uid() = id or public.is_admin(auth.uid()));

-- Allow inserting own profile row (not strictly needed because trigger inserts)
drop policy if exists "Profiles: insert self" on public.profiles;
create policy "Profiles: insert self"
on public.profiles
for insert
with check (auth.uid() = id);

-- Only admins can update profiles (ban/promote)
drop policy if exists "Profiles: admin update" on public.profiles;
create policy "Profiles: admin update"
on public.profiles
for update
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- Videos metadata
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null default '',
  storage_path text not null,
  created_at timestamptz not null default now()
);

alter table public.videos enable row level security;

-- Anyone can watch content
drop policy if exists "Videos: public read" on public.videos;
create policy "Videos: public read"
on public.videos
for select
using (true);

-- Logged-in, not banned, can upload (insert)
drop policy if exists "Videos: insert by owner" on public.videos;
create policy "Videos: insert by owner"
on public.videos
for insert
with check (
  auth.role() = 'authenticated'
  and auth.uid() = user_id
  and not public.is_banned(auth.uid())
);

-- Owner or admin can update/delete
drop policy if exists "Videos: update by owner or admin" on public.videos;
create policy "Videos: update by owner or admin"
on public.videos
for update
using (auth.uid() = user_id or public.is_admin(auth.uid()))
with check (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "Videos: delete by owner or admin" on public.videos;
create policy "Videos: delete by owner or admin"
on public.videos
for delete
using (auth.uid() = user_id or public.is_admin(auth.uid()));

-- Storage policies (bucket must exist: videos)
-- Public read: anyone can stream
drop policy if exists "Storage: public read videos" on storage.objects;
create policy "Storage: public read videos"
on storage.objects
for select
using (bucket_id = 'videos');

-- Authenticated upload (owner only), not banned
drop policy if exists "Storage: upload videos" on storage.objects;
create policy "Storage: upload videos"
on storage.objects
for insert
with check (
  bucket_id = 'videos'
  and auth.role() = 'authenticated'
  and owner = auth.uid()
  and not public.is_banned(auth.uid())
);

-- Delete own objects or admin
drop policy if exists "Storage: delete videos" on storage.objects;
create policy "Storage: delete videos"
on storage.objects
for delete
using (
  bucket_id = 'videos'
  and (owner = auth.uid() or public.is_admin(auth.uid()))
);

-- ============================================================
-- Scholix — Full Database Schema
-- Run this in your Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── profiles ────────────────────────────────────────────────
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url  text,
  theme       text not null default 'light',
  font        text not null default 'default',
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can upsert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── subjects ─────────────────────────────────────────────────
create table public.subjects (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  color       text not null default '#6366f1',
  icon        text not null default '📚',
  created_at  timestamptz not null default now()
);

alter table public.subjects enable row level security;

create policy "Users manage own subjects"
  on public.subjects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── notes ─────────────────────────────────────────────────────
create table public.notes (
  id          uuid primary key default uuid_generate_v4(),
  subject_id  uuid not null references public.subjects(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null default 'Untitled',
  content     jsonb not null default '{}',
  updated_at  timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

alter table public.notes enable row level security;

create policy "Users manage own notes"
  on public.notes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── resources ─────────────────────────────────────────────────
create table public.resources (
  id          uuid primary key default uuid_generate_v4(),
  subject_id  uuid not null references public.subjects(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  file_url    text not null,
  file_type   text not null,
  size        bigint not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.resources enable row level security;

create policy "Users manage own resources"
  on public.resources for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── tasks ─────────────────────────────────────────────────────
create table public.tasks (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  subject_id  uuid references public.subjects(id) on delete set null,
  title       text not null,
  due_date    date,
  priority    text not null default 'medium' check (priority in ('low','medium','high')),
  completed   boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.tasks enable row level security;

create policy "Users manage own tasks"
  on public.tasks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── results ───────────────────────────────────────────────────
create table public.results (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  subject_id  uuid not null references public.subjects(id) on delete cascade,
  title       text not null,
  score       numeric not null,
  max_score   numeric not null default 100,
  weight      numeric not null default 0,
  date        date not null default current_date,
  created_at  timestamptz not null default now()
);

alter table public.results enable row level security;

create policy "Users manage own results"
  on public.results for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── practice_questions ────────────────────────────────────────
create table public.practice_questions (
  id          uuid primary key default uuid_generate_v4(),
  subject_id  uuid not null references public.subjects(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  question    text not null,
  answer      text not null,
  difficulty  text not null default 'medium' check (difficulty in ('easy','medium','hard')),
  created_at  timestamptz not null default now()
);

alter table public.practice_questions enable row level security;

create policy "Users manage own practice questions"
  on public.practice_questions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Storage bucket for resources ──────────────────────────────
-- Run this separately in Supabase Dashboard → Storage → New Bucket
-- Bucket name: "resources", Public: true
-- Or via SQL:
insert into storage.buckets (id, name, public)
values ('resources', 'resources', true)
on conflict do nothing;

create policy "Users upload own resources"
  on storage.objects for insert
  with check (bucket_id = 'resources' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Public can read resources"
  on storage.objects for select
  using (bucket_id = 'resources');

create policy "Users delete own resources"
  on storage.objects for delete
  using (bucket_id = 'resources' and auth.uid()::text = (storage.foldername(name))[1]);

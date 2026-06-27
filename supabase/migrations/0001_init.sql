-- ╔══════════════════════════════════════════════════════════════╗
-- ║ TradeGradyzer — initial schema                                 ║
-- ╚══════════════════════════════════════════════════════════════╝

-- ── profiles ─────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  subscription_status text not null default 'free',      -- free | active | canceled
  subscription_plan text,                                -- weekly | monthly
  subscription_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by owner"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── analyses ─────────────────────────────────────────────────────
create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  pair text,
  notes text,
  score int,
  confidence text,
  bias text,
  result jsonb not null,           -- full structured analysis
  images jsonb not null default '{}'::jsonb,  -- { "4h": url, "1h": url, "30m": url }
  created_at timestamptz not null default now()
);

create index if not exists analyses_user_created_idx
  on public.analyses (user_id, created_at desc);

alter table public.analyses enable row level security;

create policy "Users can read own analyses"
  on public.analyses for select using (auth.uid() = user_id);

create policy "Users can insert own analyses"
  on public.analyses for insert with check (auth.uid() = user_id);

create policy "Users can delete own analyses"
  on public.analyses for delete using (auth.uid() = user_id);

-- keep updated_at fresh on profiles
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ── storage bucket for chart images ──────────────────────────────
insert into storage.buckets (id, name, public)
values ('charts', 'charts', true)
on conflict (id) do nothing;

create policy "Chart images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'charts');

create policy "Users can upload to own chart folder"
  on storage.objects for insert
  with check (
    bucket_id = 'charts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update own chart files"
  on storage.objects for update
  using (
    bucket_id = 'charts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own chart files"
  on storage.objects for delete
  using (
    bucket_id = 'charts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

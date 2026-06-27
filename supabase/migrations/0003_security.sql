-- ╔══════════════════════════════════════════════════════════════╗
-- ║ Security hardening                                             ║
-- ║  1. Subscription columns become server-only (no self-grant)   ║
-- ║  2. Server-controlled usage ledger for free-limit + rate-limit ║
-- ╚══════════════════════════════════════════════════════════════╝

-- ── 1. Protect subscription columns ──────────────────────────────
-- Users can still edit their profile (e.g. full_name), but any attempt
-- to change subscription_* from a normal (non service_role) session is
-- silently reverted. Only the edge function (service role) can grant.
create or replace function public.protect_subscription_columns()
returns trigger
language plpgsql
as $$
declare
  jwt_role text;
begin
  jwt_role := coalesce(
    (current_setting('request.jwt.claims', true))::jsonb ->> 'role',
    ''
  );
  if jwt_role <> 'service_role' then
    new.subscription_status := old.subscription_status;
    new.subscription_plan := old.subscription_plan;
    new.subscription_expires_at := old.subscription_expires_at;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_subscription on public.profiles;
create trigger protect_subscription
  before update on public.profiles
  for each row execute function public.protect_subscription_columns();

-- ── 2. Usage ledger (written only by the edge function) ──────────
create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null default 'analysis',
  created_at timestamptz not null default now()
);

create index if not exists usage_events_user_time_idx
  on public.usage_events (user_id, created_at desc);

alter table public.usage_events enable row level security;

-- Users may read their own usage, but cannot insert/update/delete it.
-- (The edge function uses the service role, which bypasses RLS.)
drop policy if exists "Users can read own usage" on public.usage_events;
create policy "Users can read own usage"
  on public.usage_events for select
  using (auth.uid() = user_id);

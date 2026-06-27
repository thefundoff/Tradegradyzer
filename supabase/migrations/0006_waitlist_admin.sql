-- ╔══════════════════════════════════════════════════════════════╗
-- ║ Waitlist (for sold-out lifetime) + owner admin views          ║
-- ╚══════════════════════════════════════════════════════════════╝

-- ── Waitlist ─────────────────────────────────────────────────────
create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  user_id uuid references auth.users (id) on delete set null,
  source text not null default 'lifetime_soldout',
  created_at timestamptz not null default now()
);

-- One row per email (case-insensitive).
create unique index if not exists waitlist_email_uidx on public.waitlist (lower(email));

alter table public.waitlist enable row level security;
-- No client-readable policy: joins go through the RPC, reads via admin RPC only.

-- Join the waitlist. Safe for anyone to call; de-dupes by email.
create or replace function public.join_waitlist(p_email text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
begin
  if v_email = '' or position('@' in v_email) = 0 then
    return 'invalid';
  end if;
  insert into public.waitlist (email, user_id, source)
  values (v_email, auth.uid(), 'lifetime_soldout')
  on conflict (lower(email)) do nothing;
  return 'ok';
end;
$$;

grant execute on function public.join_waitlist(text) to anon, authenticated;

-- ── Admin (owner-only) ───────────────────────────────────────────
alter table public.profiles add column if not exists is_admin boolean not null default false;

-- Seed the owner account as admin.
update public.profiles
set is_admin = true
where id = (select id from auth.users where lower(email) = 'ignitechglobalitunit@gmail.com');

-- Protect is_admin from self-promotion (extend the existing column guard).
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
    new.is_admin := old.is_admin;
  end if;
  return new;
end;
$$;

-- Is the current caller an admin?
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

grant execute on function public.is_admin() to authenticated;

-- Every paying/canceled subscriber with their plan + email (admin only).
create or replace function public.admin_subscribers()
returns table (
  user_id uuid,
  email text,
  full_name text,
  plan text,
  status text,
  expires_at timestamptz,
  joined timestamptz
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;
  return query
    select p.id, u.email::text, p.full_name, p.subscription_plan, p.subscription_status,
           p.subscription_expires_at, p.created_at
    from public.profiles p
    join auth.users u on u.id = p.id
    where p.subscription_status in ('active', 'canceled')
      and p.subscription_plan is not null
    order by
      case p.subscription_plan
        when 'lifetime' then 0 when 'monthly' then 1 when 'weekly' then 2 else 3
      end,
      p.updated_at desc;
end;
$$;

grant execute on function public.admin_subscribers() to authenticated;

-- The waitlist (admin only).
create or replace function public.admin_waitlist()
returns table (email text, user_id uuid, created_at timestamptz)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;
  return query
    select w.email, w.user_id, w.created_at from public.waitlist w order by w.created_at desc;
end;
$$;

grant execute on function public.admin_waitlist() to authenticated;

-- ╔══════════════════════════════════════════════════════════════╗
-- ║ Trader profile — personalize analysis to how each trader trades ║
-- ╚══════════════════════════════════════════════════════════════╝
-- Adds trading-style / setups / risk / markets to profiles and threads them
-- through the new-user trigger so they're captured at signup (via user
-- metadata). `onboarded` drives the one-time onboarding gate for users who
-- signed up before this (incl. Google OAuth).

alter table public.profiles
  add column if not exists trader_style   text,
  add column if not exists setups         text[] not null default '{}',
  add column if not exists risk_appetite  text,
  add column if not exists markets         text[] not null default '{}',
  add column if not exists onboarded      boolean not null default false;

-- Recreate the signup handler to persist the trading profile from metadata.
-- These columns are user-editable (RLS update policy already allows owners),
-- and the subscription-protection trigger leaves them untouched.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_style text := nullif(meta ->> 'trader_style', '');
begin
  insert into public.profiles (id, full_name, trader_style, setups, risk_appetite, markets, onboarded)
  values (
    new.id,
    coalesce(meta ->> 'full_name', ''),
    v_style,
    case when jsonb_typeof(meta -> 'setups') = 'array'
         then array(select jsonb_array_elements_text(meta -> 'setups')) else '{}' end::text[],
    nullif(meta ->> 'risk_appetite', ''),
    case when jsonb_typeof(meta -> 'markets') = 'array'
         then array(select jsonb_array_elements_text(meta -> 'markets')) else '{}' end::text[],
    -- Onboarded if they answered the style question during signup.
    (v_style is not null)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

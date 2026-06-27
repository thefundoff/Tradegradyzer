-- ╔══════════════════════════════════════════════════════════════╗
-- ║ Lifetime campaign cap — at most 100 lifetime seats, race-safe  ║
-- ╚══════════════════════════════════════════════════════════════╝

-- How many lifetime seats have sold (distinct buyers in the ledger).
-- SECURITY DEFINER so the public pricing page can read the count past RLS.
create or replace function public.lifetime_seats_taken()
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select count(distinct user_id)::int
  from public.payments
  where plan = 'lifetime';
$$;

grant execute on function public.lifetime_seats_taken() to anon, authenticated;

-- Atomically claim a lifetime seat and grant access, or report 'sold_out'.
-- Serialized with a transaction-scoped advisory lock so concurrent payments
-- can never oversell the cap. Returns: 'granted' | 'already' | 'sold_out'.
-- MUST only ever be called by the server (service role) — it grants access.
create or replace function public.claim_lifetime_seat(
  p_user_id uuid,
  p_reference text,
  p_amount integer,
  p_currency text,
  p_limit integer default 100
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_has boolean;
begin
  -- Serialize all lifetime claims for the duration of this transaction.
  perform pg_advisory_xact_lock(hashtext('tg_lifetime_campaign'));

  -- Idempotency: this exact payment was already processed.
  if exists (select 1 from public.payments where reference = p_reference) then
    return 'already';
  end if;

  -- A returning lifetime buyer already holds a seat — don't consume a new one.
  select exists (
    select 1 from public.payments where user_id = p_user_id and plan = 'lifetime'
  ) into v_has;

  if not v_has then
    select count(distinct user_id) into v_count
    from public.payments where plan = 'lifetime';
    if v_count >= p_limit then
      return 'sold_out';
    end if;
  end if;

  -- Record the sale (idempotency anchor) and grant lifetime (null = forever).
  insert into public.payments (user_id, reference, plan, amount, currency)
  values (p_user_id, p_reference, 'lifetime', p_amount, p_currency);

  update public.profiles
  set subscription_status = 'active',
      subscription_plan = 'lifetime',
      subscription_expires_at = null
  where id = p_user_id;

  return 'granted';
end;
$$;

-- Lock it down: clients must never call this directly (it grants a paid plan).
revoke execute on function public.claim_lifetime_seat(uuid, text, integer, text, integer)
  from public, anon, authenticated;
grant execute on function public.claim_lifetime_seat(uuid, text, integer, text, integer)
  to service_role;

-- ╔══════════════════════════════════════════════════════════════╗
-- ║ Payments ledger — makes Paystack verification idempotent       ║
-- ║ (a reference can only ever grant once → no replay extension)   ║
-- ╚══════════════════════════════════════════════════════════════╝

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  reference text not null unique,
  plan text,
  amount integer,        -- in minor units (kobo/cents)
  currency text,
  status text not null default 'success',
  created_at timestamptz not null default now()
);

create index if not exists payments_user_idx on public.payments (user_id, created_at desc);

alter table public.payments enable row level security;

-- Users may read their own payments; only the server (service role) writes.
drop policy if exists "Users can read own payments" on public.payments;
create policy "Users can read own payments"
  on public.payments for select
  using (auth.uid() = user_id);

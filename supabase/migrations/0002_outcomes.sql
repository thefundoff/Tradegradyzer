-- ╔══════════════════════════════════════════════════════════════╗
-- ║ Outcome tracking + AI calibration feedback loop                ║
-- ╚══════════════════════════════════════════════════════════════╝

alter table public.analyses
  add column if not exists outcome text not null default 'pending'
    check (outcome in ('pending', 'win', 'loss', 'breakeven')),
  add column if not exists outcome_rr numeric,          -- actual R multiple achieved
  add column if not exists outcome_note text,           -- what happened / why
  add column if not exists outcome_logged_at timestamptz;

create index if not exists analyses_user_outcome_idx
  on public.analyses (user_id, outcome);

-- Users must be able to UPDATE their own analysis row to log an outcome.
drop policy if exists "Users can update own analyses" on public.analyses;
create policy "Users can update own analyses"
  on public.analyses for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

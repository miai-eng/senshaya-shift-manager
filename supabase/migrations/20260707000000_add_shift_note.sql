-- Add optional note (time-of-day) to shifts.
-- Used for supplementary manually-entered times (e.g. end time) shown in the
-- app UI only. SMS generation reads start_time exclusively and ignores this.
-- Applied to production via SQL Editor on 2026-07-07 before code deploy.
alter table public.shifts add column if not exists note time;

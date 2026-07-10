-- Create shift_locks in case it doesn't exist yet (avoids merge-order dependency with PR #34)
create table if not exists public.shift_locks (
  shift_date date primary key,
  locked_by uuid references public.managers(id),
  locked_at timestamptz not null default now()
);

alter table public.shift_locks enable row level security;

create policy "managers_full_access_shift_locks"
  on public.shift_locks for all to authenticated
  using (true) with check (true);

-- Anonymous users can read confirmed dates
create policy "anon_read_shift_locks"
  on public.shift_locks for select to anon
  using (true);

-- Anonymous users can read shifts for confirmed dates only
create policy "anon_read_confirmed_shifts"
  on public.shifts for select to anon
  using (
    exists (
      select 1 from public.shift_locks sl
      where sl.shift_date = shifts.shift_date
    )
  );

-- Anonymous users can read basic info for active employees (queries select name/id only)
create policy "anon_read_active_employees"
  on public.employees for select to anon
  using (is_active = true);

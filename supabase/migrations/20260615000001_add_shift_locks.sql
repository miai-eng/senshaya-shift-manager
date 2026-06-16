create table public.shift_locks (
  shift_date  date        primary key,
  locked_at   timestamptz not null default now()
);

alter table public.shift_locks enable row level security;

create policy "managers_full_access_shift_locks"
  on public.shift_locks for all to authenticated
  using (true) with check (true);

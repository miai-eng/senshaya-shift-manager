-- shift_locks テーブルが未作成の場合に備えて作成（PR #34 とのマージ順依存を回避）
create table if not exists public.shift_locks (
  shift_date date primary key,
  locked_by uuid references public.managers(id),
  locked_at timestamptz not null default now()
);

alter table public.shift_locks enable row level security;

create policy "managers_full_access_shift_locks"
  on public.shift_locks for all to authenticated
  using (true) with check (true);

-- 確定済み日付を匿名ユーザーが読める
create policy "anon_read_shift_locks"
  on public.shift_locks for select to anon
  using (true);

-- 確定済み日付のシフトのみ匿名ユーザーが読める
create policy "anon_read_confirmed_shifts"
  on public.shifts for select to anon
  using (
    exists (
      select 1 from public.shift_locks sl
      where sl.shift_date = shifts.shift_date
    )
  );

-- アクティブ従業員の基本情報を匿名ユーザーが読める（クエリ側で name/id のみ選択する）
create policy "anon_read_active_employees"
  on public.employees for select to anon
  using (is_active = true);

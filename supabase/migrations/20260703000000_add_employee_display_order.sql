alter table employees
  add column if not exists display_order integer not null default 999;

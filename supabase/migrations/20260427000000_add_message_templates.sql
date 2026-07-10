-- =============================================================================
-- message_templates table (Issue #11 Stage 2)
-- =============================================================================
-- Stores the message templates used for shift notifications.
-- type: 'attend' | 'off', exactly one row allowed per type.
-- See docs/template-spec.md for placeholder syntax and variable spec.
-- =============================================================================

create table public.message_templates (
  id         uuid        primary key default gen_random_uuid(),
  type       text        not null unique check (type in ('attend', 'off')),
  body       text        not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =============================================================================
-- Row Level Security
-- =============================================================================
-- Read: all authenticated users. Write: managers only.
-- is_manager() is defined in initial_schema.
-- =============================================================================

alter table public.message_templates enable row level security;

create policy "authenticated_select_message_templates"
  on public.message_templates for select to authenticated
  using (true);

create policy "managers_insert_message_templates"
  on public.message_templates for insert to authenticated
  with check (public.is_manager());

create policy "managers_update_message_templates"
  on public.message_templates for update to authenticated
  using (public.is_manager())
  with check (public.is_manager());

create policy "managers_delete_message_templates"
  on public.message_templates for delete to authenticated
  using (public.is_manager());

-- =============================================================================
-- Initial seed data (from docs/template-spec.md §8)
-- =============================================================================

insert into public.message_templates (type, body) values
  ('attend', '明日 {date} は {time} からです'),
  ('off',    '明日 {date} はお休みです');

-- ============================================================
-- Finzo · Metas de ahorro (savings goals)
-- Ejecuta esto en Supabase -> SQL Editor.
-- ============================================================

create table if not exists public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  target_amount numeric(14, 2) not null default 0,
  saved_amount numeric(14, 2) not null default 0,
  target_date date,
  color text not null default '#0ecb81',
  icon text not null default 'PiggyBank',
  created_at timestamptz not null default now()
);
create index if not exists savings_goals_user_idx on public.savings_goals (user_id);

alter table public.savings_goals enable row level security;

create policy "savings_goals_all_own" on public.savings_goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- Finzo · Gastos fijos (obligaciones mensuales recurrentes)
-- Ejecuta esto en Supabase -> SQL Editor.
-- ============================================================

create table if not exists public.fixed_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  amount numeric(14, 2) not null default 0,
  category_id uuid references public.categories (id) on delete set null,
  due_day int check (due_day between 1 and 31),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists fixed_expenses_user_idx on public.fixed_expenses (user_id, active);

alter table public.fixed_expenses enable row level security;

create policy "fixed_expenses_all_own" on public.fixed_expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

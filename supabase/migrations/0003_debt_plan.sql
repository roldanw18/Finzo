-- ============================================================
-- Finzo · Plan de Libertad Financiera (deudas)
-- Ejecuta esto en Supabase -> SQL Editor.
-- ============================================================

-- ---------- DEBTS ----------
create table if not exists public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  creditor text not null default '',
  initial_balance numeric(14, 2) not null default 0,
  balance numeric(14, 2) not null default 0,
  interest_rate numeric(6, 2),
  type text not null default 'other'
    check (type in ('credit_card', 'loan', 'family', 'vehicle', 'other')),
  min_payment numeric(14, 2) not null default 0,
  target_payment numeric(14, 2) not null default 0,
  cut_day int check (cut_day between 1 and 31),
  due_day int check (due_day between 1 and 31),
  priority int not null default 0,
  status text not null default 'active' check (status in ('active', 'paid')),
  created_at timestamptz not null default now()
);
create index if not exists debts_user_idx on public.debts (user_id, status);

-- ---------- DEBT PAYMENTS ----------
create table if not exists public.debt_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  debt_id uuid not null references public.debts (id) on delete cascade,
  amount numeric(14, 2) not null check (amount >= 0),
  date date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists debt_payments_user_idx on public.debt_payments (user_id, date desc);
create index if not exists debt_payments_debt_idx on public.debt_payments (debt_id);

-- ---------- DEBT GOALS ----------
create table if not exists public.debt_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  kind text not null default 'debt' check (kind in ('all', 'type', 'debt')),
  debt_type text,
  debt_id uuid references public.debts (id) on delete cascade,
  target_date date,
  created_at timestamptz not null default now()
);
create index if not exists debt_goals_user_idx on public.debt_goals (user_id);

-- ---------- WORK SESSIONS (Uber) ----------
create table if not exists public.work_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null default current_date,
  hours numeric(6, 2) not null default 0,
  earnings numeric(14, 2) not null default 0,
  fuel_cost numeric(14, 2) not null default 0,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists work_sessions_user_idx on public.work_sessions (user_id, date desc);

-- ---------- REMINDERS (calendario financiero) ----------
create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  category text not null default 'otro',
  date date not null,
  amount numeric(14, 2),
  recurring text not null default 'none' check (recurring in ('none', 'monthly', 'yearly')),
  note text,
  created_at timestamptz not null default now()
);
create index if not exists reminders_user_idx on public.reminders (user_id, date);

-- ============================================================
-- Row Level Security (cada usuario solo ve lo suyo)
-- ============================================================
alter table public.debts enable row level security;
alter table public.debt_payments enable row level security;
alter table public.debt_goals enable row level security;
alter table public.work_sessions enable row level security;
alter table public.reminders enable row level security;

create policy "debts_all_own" on public.debts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "debt_payments_all_own" on public.debt_payments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "debt_goals_all_own" on public.debt_goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "work_sessions_all_own" on public.work_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "reminders_all_own" on public.reminders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

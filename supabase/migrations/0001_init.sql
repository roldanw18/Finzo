-- ============================================================
-- Finzo · esquema inicial
-- Ejecuta esto en tu proyecto Supabase (SQL Editor) o vía CLI.
-- ============================================================

-- ---------- PROFILES ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  currency text not null default 'COP' check (currency in ('COP', 'USD')),
  theme text not null default 'dark' check (theme in ('dark', 'light')),
  opening_balance numeric(14, 2) not null default 0,
  budgets jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------- CATEGORIES ----------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  color text not null default '#94a3b8',
  icon text not null default 'Shapes',
  type text not null default 'expense' check (type in ('expense', 'income')),
  sort_order int not null default 0,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists categories_user_idx on public.categories (user_id, sort_order);

-- ---------- INCOMES ----------
create table if not exists public.incomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount numeric(14, 2) not null check (amount >= 0),
  date date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists incomes_user_date_idx on public.incomes (user_id, date desc);

-- ---------- EXPENSES ----------
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount numeric(14, 2) not null check (amount >= 0),
  category_id uuid references public.categories (id) on delete set null,
  date date not null default current_date,
  description text,
  payment_method text not null default 'cash',
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists expenses_user_date_idx on public.expenses (user_id, date desc);
create index if not exists expenses_category_idx on public.expenses (category_id);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.incomes enable row level security;
alter table public.expenses enable row level security;

-- Profiles: a user only sees/edits their own row
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Generic per-table owner policies
create policy "categories_all_own" on public.categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "incomes_all_own" on public.incomes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "expenses_all_own" on public.expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

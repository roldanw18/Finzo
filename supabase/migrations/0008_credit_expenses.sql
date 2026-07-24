-- ============================================================
-- Finzo · gastos con tarjeta de crédito
-- Un gasto "a crédito" aparece en el historial y en las categorías,
-- suma a la deuda de la tarjeta, pero NO reduce tu saldo (es deuda).
-- Ejecuta esto en Supabase -> SQL Editor.
-- ============================================================

alter table public.expenses
  add column if not exists on_credit boolean not null default false,
  add column if not exists debt_id uuid references public.debts (id) on delete set null;

create index if not exists expenses_debt_idx on public.expenses (debt_id);

-- Cupo (límite) de las tarjetas de crédito, para mostrar cuánto queda.
alter table public.debts
  add column if not exists credit_limit numeric(14, 2);

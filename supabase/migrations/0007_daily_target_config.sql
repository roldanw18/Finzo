-- ============================================================
-- Finzo · configuración de la meta diaria
-- Días que trabajas por semana (para no repartir en días de descanso)
-- y casilla para elegir qué gastos fijos cuentan en la meta.
-- Ejecuta esto en Supabase -> SQL Editor.
-- ============================================================

alter table public.profiles
  add column if not exists work_days_per_week int not null default 7
    check (work_days_per_week between 1 and 7);

alter table public.fixed_expenses
  add column if not exists count_in_target boolean not null default true;

-- ============================================================
-- Finzo · Meta diaria de ahorro (daily savings target)
-- Agrega el monto manual a apartar por día en cada meta de ahorro.
-- null/0 = se calcula automáticamente (lo que falta ÷ días hasta la fecha meta).
-- Ejecuta esto en Supabase -> SQL Editor.
-- ============================================================

alter table public.savings_goals
  add column if not exists daily_target numeric(14, 2);

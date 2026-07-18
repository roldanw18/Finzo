-- ============================================================
-- Finzo · marcar qué deudas cuentan en la Meta diaria de ingresos
-- Ejecuta esto en Supabase -> SQL Editor.
-- ============================================================

alter table public.debts
  add column if not exists count_in_target boolean not null default true;

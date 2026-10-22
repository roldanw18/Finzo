-- ============================================================
-- Finzo · Aportes que descuentan del dinero disponible
-- Registra cuánto efectivo se movió desde "disponible" a cada meta
-- mediante aportes (la columna sube con cada aporte y baja con cada retiro).
-- El "ya ahorrado" inicial NO cuenta aquí, así que no afecta el disponible.
-- Ejecuta esto en Supabase -> SQL Editor.
-- ============================================================

alter table public.savings_goals
  add column if not exists reserved_from_cash numeric(14, 2) not null default 0;

-- ============================================================
-- Finzo · Servicios rápidos + analítica por servicio
-- - profiles.services: menú configurable de servicios/productos (nombre + precio)
-- - incomes.items: qué servicios compusieron cada ingreso (para analítica)
-- Ejecuta esto en Supabase -> SQL Editor.
-- ============================================================

alter table public.profiles
  add column if not exists services jsonb not null default '[]'::jsonb;

alter table public.incomes
  add column if not exists items jsonb;

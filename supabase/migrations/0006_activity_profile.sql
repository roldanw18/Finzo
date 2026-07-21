-- ============================================================
-- Finzo · perfil de actividad (multi-oficio)
-- La app se adapta al oficio del usuario: conductor, barbero,
-- domicilios, negocio, freelance, empleado u otro.
-- Ejecuta esto en Supabase -> SQL Editor.
-- ============================================================

alter table public.profiles
  add column if not exists activity_type text,
  add column if not exists income_label text not null default 'Ingreso',
  add column if not exists cost_label text not null default 'Costos',
  add column if not exists cost_factor numeric(4, 2) not null default 1.2,
  add column if not exists onboarded boolean not null default false;

-- Los ingresos ya no son "uber": pasan a ser el ingreso principal.
alter table public.incomes alter column source set default 'main';
update public.incomes set source = 'main' where source = 'uber';

-- Los perfiles que ya existían son usuarios activos (conductor): no deben
-- volver a ver el asistente de configuración.
update public.profiles
set activity_type = coalesce(activity_type, 'driver'),
    income_label = 'Viaje',
    cost_label = 'Gasolina',
    cost_factor = 1.3,
    onboarded = true
where onboarded = false;

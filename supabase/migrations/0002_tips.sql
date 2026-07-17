-- ============================================================
-- Finzo · módulo de propinas
-- Agrega la columna "source" a los ingresos para distinguir
-- las propinas ('tip') del ingreso normal de Uber ('uber').
-- Ejecuta esto en Supabase -> SQL Editor.
-- ============================================================

alter table public.incomes
  add column if not exists source text not null default 'uber';

-- (Opcional) restringe los valores permitidos:
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'incomes_source_check'
  ) then
    alter table public.incomes
      add constraint incomes_source_check check (source in ('uber', 'tip'));
  end if;
end $$;

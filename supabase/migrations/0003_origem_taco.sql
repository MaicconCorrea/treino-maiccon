-- Registro de alimento pela busca na TACO
alter table public.foods_log drop constraint if exists foods_log_origem_check;
alter table public.foods_log add constraint foods_log_origem_check
  check (origem in ('foto_tabela','foto_prato','manual','taco'));

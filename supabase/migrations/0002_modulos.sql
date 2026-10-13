-- Fases 2 a 7: colunas extras, ajustes por dia, receitas, arquivos.

-- Perfil: modo retorno de lesão da corrida
alter table public.profiles
  add column retorno_lesao boolean not null default true,
  add column retorno_nivel smallint not null default 1 check (retorno_nivel between 1 and 6);

-- Sessões: detalhes vindos do app e do Strava
alter table public.workout_sessions
  add column fonte text not null default 'app' check (fonte in ('app','strava','manual')),
  add column inicio timestamptz,
  add column distancia_m numeric(9,1),
  add column elevacao_m numeric(7,1),
  add column fc_max integer,
  add column intensidade text check (intensidade in ('leve','moderada','forte')),
  add column series integer,
  add column volume_kg integer,
  add column strava_tipo text,
  add column nome text;

-- Ajuste do plano de um dia específico (trocar ou remover atividades)
create table public.day_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  data date not null,
  atividades jsonb not null default '[]',
  unique (user_id, data)
);

-- Receitas do protocolo (arquivo + data). Itens apontam para a receita.
create table public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  data date not null,
  medico text,
  file_path text,
  notas text,
  created_at timestamptz not null default now()
);
alter table public.protocol_items
  add column prescription_id uuid references public.prescriptions (id) on delete set null,
  add column dias_por_dose smallint not null default 1;

-- Strava: id do atleta (o webhook só informa o owner_id)
alter table public.strava_tokens
  add column athlete_id bigint unique,
  add column scope text,
  add column updated_at timestamptz not null default now();

alter table public.day_plans     enable row level security;
alter table public.prescriptions enable row level security;
create policy "dono" on public.day_plans for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "dono" on public.prescriptions for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Arquivos privados: fotos de comida, laudos e receitas. Pasta = id do dono.
insert into storage.buckets (id, name, public)
values ('fotos','fotos',false), ('laudos','laudos',false), ('receitas','receitas',false)
on conflict (id) do nothing;

create policy "arquivos do dono" on storage.objects for all to authenticated
  using (bucket_id in ('fotos','laudos','receitas') and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id in ('fotos','laudos','receitas') and (storage.foldername(name))[1] = (select auth.uid())::text);

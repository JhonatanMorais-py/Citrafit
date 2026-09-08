create table if not exists public.cad_perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null check (char_length(nome) between 3 and 120),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.cad_perfis enable row level security;

drop policy if exists "perfil_select_own" on public.cad_perfis;
create policy "perfil_select_own"
on public.cad_perfis
for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "perfil_update_own" on public.cad_perfis;
create policy "perfil_update_own"
on public.cad_perfis
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

comment on table public.cad_perfis is
  'Cadastro complementar dos usuários autenticados pelo Supabase Auth';

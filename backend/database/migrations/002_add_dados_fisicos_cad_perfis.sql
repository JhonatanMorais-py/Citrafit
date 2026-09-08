alter table public.cad_perfis
  add column if not exists altura_cm numeric(5,1),
  add column if not exists peso_kg numeric(5,1);

alter table public.cad_perfis
  drop constraint if exists cad_perfis_altura_cm_check,
  add constraint cad_perfis_altura_cm_check
    check (altura_cm is null or altura_cm between 80 and 250),
  drop constraint if exists cad_perfis_peso_kg_check,
  add constraint cad_perfis_peso_kg_check
    check (peso_kg is null or peso_kg between 25 and 350);

comment on column public.cad_perfis.altura_cm is 'Altura atual do cliente em centímetros';
comment on column public.cad_perfis.peso_kg is 'Peso atual do cliente em quilogramas';

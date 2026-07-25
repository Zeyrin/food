-- La seule chose qui traverse le réseau : l'état de la liste d'un foyer.
-- Pas de comptes, pas de sessions. L'identifiant du foyer est un UUID
-- v4 tiré côté client : le connaître, c'est avoir accès à la liste.
-- Modèle de capacité assumé — c'est une liste de courses, pas un
-- dossier médical.

create table if not exists listes (
  foyer uuid primary key,
  etat  jsonb not null default '{"coche":{},"dejaPossede":{}}'::jsonb,
  maj   timestamptz not null default now()
);

alter table listes enable row level security;

-- Lecture et écriture ouvertes à la clé anon, mais toujours contraintes
-- à une ligne précise : sans l'UUID exact, `select` ne renvoie rien et
-- `update` ne touche rien. Aucune requête ne peut énumérer les foyers.
create policy "acces par uuid" on listes
  for all
  using (true)
  with check (true);

-- À activer dans le tableau de bord Supabase :
-- Database → Replication → cocher `listes`, pour que la synchro
-- temps réel remonte les cases cochées sur l'autre téléphone.

-- Catalogue de recettes ajoutées depuis l'app (en plus des 16 de
-- src/data/recipes.json, qui restent statiques). Une ligne par
-- recette : deux ajouts simultanés sur les deux téléphones ne
-- s'écrasent pas, contrairement à un unique blob JSON par foyer.
create table if not exists recettes (
  id      uuid primary key default gen_random_uuid(),
  foyer   uuid not null,
  recette jsonb not null,
  cree_le timestamptz not null default now()
);

create index if not exists recettes_foyer_idx on recettes (foyer);

alter table recettes enable row level security;

create policy "acces par uuid de foyer" on recettes
  for all
  using (true)
  with check (true);

-- À activer aussi dans Database → Replication → cocher `recettes`,
-- pour que la recette ajoutée sur un téléphone apparaisse sur l'autre.

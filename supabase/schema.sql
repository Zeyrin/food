-- La seule chose qui traverse le réseau : l'état de la liste d'un foyer.
-- L'identifiant du foyer est un UUID v4 : le connaître, c'est avoir accès
-- à la liste. Modèle de capacité assumé — c'est une liste de courses, pas
-- un dossier médical.
--
-- ORDRE D'EXÉCUTION
--
--   1. ce fichier          → les tables et la réplication
--   2. migration-01-…sql   → les policies, sans lesquelles TOUT est ouvert
--
-- Ce fichier ne crée volontairement AUCUNE policy. Les tables sortent donc
-- d'ici en RLS active et sans règle, c'est-à-dire fermées à double tour :
-- un projet à moitié installé refuse tout, au lieu de tout laisser passer.
-- C'était l'erreur d'avant — des policies `using (true)` dont le
-- commentaire prétendait contraindre par UUID, alors que le filtrage ne se
-- faisait que côté client, avec une clé anon publique par construction.

create table if not exists listes (
  foyer uuid primary key,
  etat  jsonb not null default '{"coche":{},"dejaPossede":{}}'::jsonb,
  maj   timestamptz not null default now()
);

alter table listes enable row level security;

-- Policies : voir migration-01-appartenance.sql

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

-- Policies : voir migration-01-appartenance.sql

-- À activer aussi dans Database → Replication → cocher `recettes`,
-- pour que la recette ajoutée sur un téléphone apparaisse sur l'autre.

-- Code court (6 caractères) pour rejoindre un foyer sans avoir à
-- copier/coller l'UUID complet. Sert uniquement à résoudre
-- code → foyer une fois, à la saisie : toutes les opérations
-- suivantes (recettes, liste) continuent de passer par l'UUID, qui
-- reste la vraie clé d'accès. Un code à 6 caractères est bien plus
-- court à deviner qu'un UUID : la table n'est donc jamais lisible en
-- direct. On ne l'atteint que par `rejoindre_foyer(code)`, qui exige une
-- correspondance exacte et compte les essais (migration-01).
create table if not exists foyers (
  foyer uuid primary key,
  code  text not null unique,
  cree_le timestamptz not null default now()
);

alter table foyers enable row level security;

-- Policies : voir migration-01-appartenance.sql

-- Ce qui a été cuisiné et ce qu'on en a pensé. Partagé par foyer :
-- « on a mangé ça mardi » et « on ne veut plus de ce plat » valent
-- pour la maison, pas pour un téléphone. Même forme qu'une liste :
-- une ligne, un JSON, dernier écrivain gagne.
create table if not exists historiques (
  foyer     uuid primary key,
  historique jsonb not null default '{"derniereFois":{},"verdicts":{}}'::jsonb,
  maj       timestamptz not null default now()
);

alter table historiques enable row level security;

-- Policies : voir migration-01-appartenance.sql

-- À cocher aussi dans Database → Replication → `historiques`.

-- Équivalent en SQL des trois cases à cocher ci-dessus, si le tableau de
-- bord n'a pas pris. Sans appartenance à cette publication, Postgres
-- n'émet rien et l'abonnement côté client reste muet pour toujours.
-- « relation is already member of publication » = c'était déjà bon,
-- passer à la ligne suivante.
alter publication supabase_realtime add table listes;
alter publication supabase_realtime add table recettes;
alter publication supabase_realtime add table historiques;

-- Vérification : doit renvoyer les trois tables.
-- select tablename from pg_publication_tables where pubname = 'supabase_realtime';

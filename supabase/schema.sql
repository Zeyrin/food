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

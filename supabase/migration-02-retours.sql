-- =============================================================================
-- Migration 02 — boîte à retours
-- =============================================================================
--
-- Une table où déposer un avis depuis l'app, visible de n'importe quel écran.
-- Volontairement hors du modèle « foyer » : donner son avis ne doit pas
-- dépendre d'avoir déjà créé ou rejoint une maison, et un avis d'un foyer ne
-- regarde pas les autres foyers.
--
-- Boîte aux lettres, pas casier : on peut y déposer, personne ne peut y lire
-- par l'API (ni les siens, ni ceux des autres) — seule policy posée ci-dessous,
-- c'est `insert`. La lecture se fait depuis le tableau de bord Supabase, avec
-- un rôle qui contourne la RLS.
--
-- Rejouable : le passer deux fois ne casse rien et ne duplique rien.
-- =============================================================================

begin;

create table if not exists retours (
  id       uuid primary key default gen_random_uuid(),
  texte    text not null,
  contact  text,
  contexte jsonb,
  cree_le  timestamptz not null default now()
);

alter table retours enable row level security;

-- `authenticated` couvre les sessions anonymes (voir migration-01) : pas
-- besoin de compte pour déposer un avis. `check` borne la taille plutôt que
-- de faire confiance au client — un texte vide ou démesuré n'a rien à faire
-- ici.
drop policy if exists "deposer un retour" on retours;
create policy "deposer un retour" on retours
  for insert
  with check (
    auth.uid() is not null
    and length(texte) between 1 and 4000
    and (contact is null or length(contact) <= 200)
  );

commit;

-- Vérification : depuis le navigateur (clé anon), après une session anonyme —
--   insert into retours (texte) values ('test') → doit passer.
--   select * from retours → doit renvoyer zéro ligne, jamais une erreur de
--   policy manquante qui laisserait deviner que la table existe.

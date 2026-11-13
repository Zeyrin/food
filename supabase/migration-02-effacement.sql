-- =============================================================================
-- Migration 02 — « Effacer mes données » depuis l'app
-- =============================================================================
--
-- POURQUOI
--
-- L'App Store (règle 5.1.1 v) et Google Play demandent qu'un utilisateur
-- puisse supprimer, depuis l'app, ce que le service garde à son sujet. FFFood
-- n'a pas de compte, mais chaque appareil ouvre une session anonyme Supabase
-- et le foyer garde sa liste, ses recettes et son historique sur le serveur.
--
-- CE QUE FAIT LA FONCTION
--
--   1. Retire l'appelant de chacun de ses foyers.
--   2. Un foyer qui n'a plus aucun membre est effacé en entier : liste,
--      recettes ajoutées, historique, code. Un foyer où quelqu'un reste est
--      laissé tel quel — ce sont aussi les données de l'autre.
--   3. Supprime la session anonyme elle-même (auth.users) ; `membres` et
--      `tentatives_code` suivent par `on delete cascade`.
--
-- SÛRETÉ
--
--   `security definer` parce que les tables n'ont aucune policy d'écriture
--   directe ; la fonction ne touche que ce qui relève de `auth.uid()`.
--   `search_path` figé, comme les fonctions de la migration 01.
--   Rejouable (create or replace). Transaction : tout ou rien.
--
-- À EXÉCUTER une fois dans le SQL Editor de Supabase, après la migration 01.
-- =============================================================================

begin;

create or replace function effacer_mes_donnees() returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  uid uuid := auth.uid();
  f   uuid;
begin
  if uid is null then
    raise exception 'session requise';
  end if;

  for f in select m.foyer from membres m where m.utilisateur = uid loop
    delete from membres where utilisateur = uid and foyer = f;
    if not exists (select 1 from membres where foyer = f) then
      delete from listes      where foyer = f;
      delete from recettes    where foyer = f;
      delete from historiques where foyer = f;
      delete from foyers      where foyer = f;
    end if;
  end loop;

  delete from auth.users where id = uid;
end;
$$;

revoke all on function effacer_mes_donnees() from public, anon;
grant execute on function effacer_mes_donnees() to authenticated;

commit;

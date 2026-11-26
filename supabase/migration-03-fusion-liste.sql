-- Migration 03 : la liste du foyer se fusionne case par case.
--
-- Jusqu'ici l'app réécrivait toute la liste à chaque toucher (upsert de
-- `listes.etat`), dernier écrivain gagnant. Deux personnes qui cochaient
-- en même temps en magasin s'effaçaient l'une l'autre. L'app envoie
-- maintenant seulement ce qui a changé (voir src/lib/patchListe.ts), et
-- cette fonction l'applique sur la ligne verrouillée.
--
-- À exécuter une fois dans l'éditeur SQL de Supabase, après
-- migration-01. Sans elle, l'app retombe sur l'ancienne écriture
-- complète : rien ne casse, mais les envois simultanés peuvent encore
-- s'écraser.

create or replace function fusionner_liste(f uuid, patch jsonb)
returns jsonb
language plpgsql
-- Invoker : les policies de `listes` (est_membre) s'appliquent comme pour
-- un upsert direct. Un non-membre ne lit ni n'écrit rien.
security invoker
set search_path = public
as $$
declare
  actuel  jsonb;
  suivant jsonb;
begin
  -- La ligne doit exister pour être verrouillée ; on la crée vide sinon.
  insert into listes (foyer) values (f) on conflict (foyer) do nothing;
  select etat into actuel from listes where foyer = f for update;
  if not found then
    raise exception 'liste inaccessible' using errcode = '42501';
  end if;

  if coalesce((patch ->> 'remplacer')::boolean, false) then
    suivant := patch - 'remplacer';
  else
    suivant := coalesce(actuel, '{}'::jsonb)
      || jsonb_build_object(
           'coche',       coalesce(actuel -> 'coche', '{}'::jsonb)       || coalesce(patch -> 'coche', '{}'::jsonb),
           'dejaPossede', coalesce(actuel -> 'dejaPossede', '{}'::jsonb) || coalesce(patch -> 'dejaPossede', '{}'::jsonb)
         );
    if patch ? 'items'  then suivant := suivant || jsonb_build_object('items',  patch -> 'items');  end if;
    if patch ? 'panier' then suivant := suivant || jsonb_build_object('panier', patch -> 'panier'); end if;
  end if;

  update listes set etat = suivant, maj = now() where foyer = f;
  return suivant;
end;
$$;

revoke all on function fusionner_liste(uuid, jsonb) from public;
grant execute on function fusionner_liste(uuid, jsonb) to authenticated;

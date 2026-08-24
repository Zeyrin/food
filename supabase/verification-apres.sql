-- ============================================================================
-- À PASSER APRÈS LA MIGRATION — lecture seule, ne modifie rien
-- ============================================================================
--
-- Une seule requête, volontairement : l'éditeur SQL de Supabase n'affiche que
-- le résultat de la DERNIÈRE instruction d'un script. Un fichier de quatre
-- `select` n'en montre donc qu'un, et les trois autres passent inaperçus.
--
-- Lecture : les lignes 1 à 8 doivent toutes dire OK. Les lignes 9 à 12 sont
-- informatives — compare-les aux chiffres notés avant la migration. Seul
-- `foyers` a le droit d'avoir monté (le rattrapage du §6).
--
-- ATTENTION : cet éditeur s'exécute avec un rôle qui CONTOURNE la RLS. Un
-- `select * from foyers` y renverra toujours des lignes, migration ou pas —
-- ce n'est pas un échec. La seule preuve que la fermeture tient est le test
-- au navigateur, en bas de ce fichier.
-- ============================================================================

with c as (
  select
    (select count(*) from listes)      as listes,
    (select count(*) from recettes)    as recettes,
    (select count(*) from historiques) as historiques,
    (select count(*) from foyers)      as foyers,
    (select count(*) from (
       select foyer from listes
       union select foyer from recettes
       union select foyer from historiques
       except select foyer from foyers) m)                        as sans_code,
    (select count(*) from pg_policies
      where schemaname='public' and policyname='foyers dont on est membre') as pol_neuves,
    (select count(*) from pg_policies
      where schemaname='public'
        and policyname in ('acces par uuid','acces par uuid de foyer',
                           'resoudre un code precis','creer son propre foyer')) as pol_vieilles,
    (select count(*) from pg_policies where schemaname='public' and tablename='foyers') as pol_foyers,
    (select count(*) from pg_proc
      where proname in ('creer_foyer','rejoindre_foyer','reclamer_foyer','est_membre')) as fonctions,
    -- `to_regclass` rend null au lieu d'échouer quand la table n'existe pas :
    -- sur une base non migrée, le diagnostic doit rendre un verdict, pas une
    -- erreur de syntaxe.
    (to_regclass('public.membres') is not null)         as a_membres,
    (to_regclass('public.tentatives_code') is not null) as a_tentatives,
    (select count(*) from pg_class c2 join pg_namespace n on n.oid=c2.relnamespace
      where n.nspname='public' and c2.relname in ('listes','recettes','historiques','foyers')
        and c2.relrowsecurity)                                     as rls_active
)
select * from (
  values
    (1, 'anciennes policies supprimees', (select pol_vieilles from c)::text, '0',
        case when (select pol_vieilles from c)=0 then 'OK' else 'ECHEC — migration pas passee' end),
    (2, 'nouvelles policies posees',     (select pol_neuves from c)::text,   '3',
        case when (select pol_neuves from c)=3 then 'OK' else 'ECHEC' end),
    (3, 'policies sur foyers',           (select pol_foyers from c)::text,   '0',
        case when (select pol_foyers from c)=0 then 'OK' else 'ECHEC — codes encore lisibles' end),
    (4, 'fonctions creees',              (select fonctions from c)::text,    '4',
        case when (select fonctions from c)=4 then 'OK' else 'ECHEC' end),
    (5, 'table membres',                 (select a_membres from c)::text,    'true',
        case when (select a_membres from c) then 'OK' else 'ECHEC' end),
    (6, 'table tentatives_code',         (select a_tentatives from c)::text, 'true',
        case when (select a_tentatives from c) then 'OK' else 'ECHEC' end),
    (7, 'RLS active sur les 4 tables',   (select rls_active from c)::text,   '4',
        case when (select rls_active from c)=4 then 'OK' else 'ECHEC' end),
    (8, 'foyers sans code restants',     (select sans_code from c)::text,    '0',
        case when (select sans_code from c)=0 then 'OK' else 'ECHEC — appareils bloques' end),
    (9, 'donnees : listes',              (select listes from c)::text,       'inchange', 'INFO'),
    (10,'donnees : recettes',            (select recettes from c)::text,     'inchange', 'INFO'),
    (11,'donnees : historiques',         (select historiques from c)::text,  'inchange', 'INFO'),
    (12,'donnees : foyers',              (select foyers from c)::text,       '>= avant', 'INFO')
) as t(n, controle, mesure, attendu, verdict)
order by n;

-- ============================================================================
-- LE TEST QUI COMPTE — dans le navigateur, pas ici
-- ============================================================================
-- Fenêtre de navigation privée, console, avec TON url de projet et TA clé anon
-- (celle du .env, publique par construction) :
--
--   const r = await fetch('https://<projet>.supabase.co/rest/v1/foyers?select=*', {
--     headers: { apikey: '<clé anon>' } })
--   console.log(r.status, await r.json())
--
-- Doit renvoyer un tableau vide : []
-- S'il renvoie des lignes, la fermeture n'a pas pris.
--
-- Même essai sur `listes`, `recettes`, `historiques` : tous doivent rendre [].
-- ============================================================================

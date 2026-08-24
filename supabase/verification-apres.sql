-- ============================================================================
-- À PASSER APRÈS LA MIGRATION — lecture seule
-- ============================================================================

-- 1. Les mêmes chiffres qu'avant, à l'exception de `foyers` qui a pu monter
--    (le rattrapage). Aucun autre ne doit avoir bougé.
select 'listes'      as table_, count(*) from listes
union all select 'recettes',    count(*) from recettes
union all select 'historiques', count(*) from historiques
union all select 'foyers',      count(*) from foyers;

-- 2. Doit renvoyer 0 : plus aucun foyer de données sans code.
select count(*) as foyers_sans_code_restants
from (
  select foyer from listes
  union select foyer from recettes
  union select foyer from historiques
  except select foyer from foyers
) manquants;

-- 3. Les nouvelles policies. Chaque table de données doit porter
--    « foyers dont on est membre », et `foyers` ne doit en porter aucune.
select tablename, policyname from pg_policies
where schemaname = 'public' order by tablename;

-- 4. Les trois portes d'entrée doivent exister.
select proname from pg_proc
where proname in ('creer_foyer', 'rejoindre_foyer', 'reclamer_foyer', 'est_membre')
order by proname;

-- 5. LE TEST QUI COMPTE — à faire dans l'app, pas ici :
--    ouvre https://www.fffood.fr dans une fenêtre de navigation privée,
--    ouvre la console, et colle (avec TON url et TA clé anon) :
--
--      const r = await fetch('https://<projet>.supabase.co/rest/v1/foyers?select=*', {
--        headers: { apikey: '<clé anon>' } })
--      console.log(await r.json())
--
--    Doit renvoyer [] — un tableau vide. S'il renvoie des lignes,
--    la migration n'a pas pris.

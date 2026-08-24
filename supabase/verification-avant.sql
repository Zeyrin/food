-- ============================================================================
-- À PASSER AVANT LA MIGRATION — lecture seule, ne modifie rien
-- ============================================================================
-- Note ces trois chiffres quelque part. Tu les recompareras après.

select 'listes'      as table_, count(*) from listes
union all select 'recettes',    count(*) from recettes
union all select 'historiques', count(*) from historiques
union all select 'foyers',      count(*) from foyers;

-- Combien de foyers ont des données mais aucun code : ce sont ceux que la
-- migration rattrape. Un chiffre non nul est normal, pas inquiétant.
select count(*) as foyers_sans_code
from (
  select foyer from listes
  union select foyer from recettes
  union select foyer from historiques
  except select foyer from foyers
) manquants;

-- Les policies actuelles. Tu dois y voir les `using (true)` qu'on remplace.
select tablename, policyname, cmd, qual::text as condition
from pg_policies where schemaname = 'public' order by tablename, policyname;

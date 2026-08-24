-- =============================================================================
-- Migration 01 — l'UUID de foyer devient une vraie capacité
-- =============================================================================
--
-- CE QUI N'ALLAIT PAS
--
-- Les policies d'origine étaient `for all using (true) with check (true)`, et
-- leur commentaire affirmait « sans l'UUID exact, select ne renvoie rien ».
-- C'était faux : `using (true)` ne contraint rien du tout. Le filtrage par
-- foyer se faisait uniquement côté client, dans sync.ts, alors que la clé anon
-- est publique par construction (préfixe VITE_, donc livrée dans le bundle).
--
-- Avec la seule URL du site, n'importe qui pouvait donc :
--   select * from foyers      -- tous les couples (uuid, code) du service
--   select * from listes      -- toutes les listes de tous les foyers
--   delete from listes        -- et effacer la semaine de tout le monde
--
-- CE QUE FAIT CETTE MIGRATION
--
-- Le modèle voulu — « qui a le lien a la liste » — est conservé, mais il est
-- désormais appliqué par la base : l'UUID (ou le code court) doit être
-- *présenté* une fois pour obtenir l'accès, et rien ne permet plus de les
-- énumérer.
--
--   1. Chaque appareil ouvre une session anonyme (invisible, pas de compte).
--   2. Une table `membres` relie cette session aux foyers auxquels elle a
--      accès. C'est elle que les policies interrogent.
--   3. On n'entre dans `membres` que par une fonction qui exige de présenter
--      le code court ou l'UUID. Les tables ne sont plus accessibles en direct.
--
-- PRÉALABLE DANS LE TABLEAU DE BORD
--
--   Authentication → Providers → Anonymous sign-ins : activer.
--   Sans ça, `auth.uid()` est nul et toutes les fonctions ci-dessous refusent.
--
-- SÛRETÉ
--
--   Aucun `drop table`, `truncate`, `delete` ni `update` : pas une ligne de
--   données existante n'est touchée. Le fichier crée des tables et des
--   fonctions, remplace des policies, et insère les codes manquants (§6).
--
--   Il est enveloppé dans une transaction : à la moindre erreur tout est
--   annulé et la base reste dans l'état d'avant. NE PAS retirer le
--   BEGIN/COMMIT — exécuté ligne à ligne, un échec au milieu laisserait les
--   anciennes policies supprimées et les nouvelles à moitié posées, donc
--   tout le monde verrouillé dehors.
--
--   Rejouable : le passer deux fois ne casse rien et ne duplique rien.
--
--   Éprouvé sur un PostgreSQL 16 monté pour l'occasion, avec des données
--   imitant la production — dont un foyer sans code, le cas rattrapé au §6.
--
-- =============================================================================

begin;

-- --- 1. Appartenance ---------------------------------------------------------

create table if not exists membres (
  utilisateur uuid not null references auth.users (id) on delete cascade,
  foyer       uuid not null,
  rejoint_le  timestamptz not null default now(),
  primary key (utilisateur, foyer)
);

create index if not exists membres_foyer_idx on membres (foyer);

alter table membres enable row level security;

-- Lecture de ses propres appartenances seulement. Aucune policy d'écriture :
-- s'inscrire soi-même dans un foyer arbitraire ferait exactement le trou que
-- cette migration bouche. Les insertions passent par les fonctions plus bas.
drop policy if exists "lire ses appartenances" on membres;
create policy "lire ses appartenances" on membres
  for select using (utilisateur = auth.uid());

-- `security definer` pour lire `membres` par-dessus sa propre RLS : la
-- fonction filtre déjà sur auth.uid(), elle ne peut rien révéler d'autre.
-- `search_path` figé — sans ça, un schéma glissé devant `public` pourrait
-- détourner l'appel, ce qui est le piège classique des fonctions definer.
create or replace function est_membre(f uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from membres where foyer = f and utilisateur = auth.uid()
  );
$$;

-- --- 2. Les trois tables de données -----------------------------------------

-- Les anciennes policies, et les nouvelles : sans ce second jeu de `drop`,
-- rejouer le fichier échouait sur « policy already exists » après avoir
-- déjà supprimé les anciennes. Dans une transaction, tout est annulé et
-- rien n'est perdu ; exécuté ligne à ligne, on restait verrouillé dehors,
-- les anciennes règles retirées et les nouvelles à moitié posées.
drop policy if exists "acces par uuid" on listes;
drop policy if exists "acces par uuid de foyer" on recettes;
drop policy if exists "acces par uuid de foyer" on historiques;

drop policy if exists "foyers dont on est membre" on listes;
drop policy if exists "foyers dont on est membre" on recettes;
drop policy if exists "foyers dont on est membre" on historiques;

create policy "foyers dont on est membre" on listes
  for all using (est_membre(foyer)) with check (est_membre(foyer));

create policy "foyers dont on est membre" on recettes
  for all using (est_membre(foyer)) with check (est_membre(foyer));

create policy "foyers dont on est membre" on historiques
  for all using (est_membre(foyer)) with check (est_membre(foyer));

-- --- 3. La table des codes n'est plus lisible --------------------------------

-- RLS active et plus aucune policy : tout accès direct est refusé, pour tout
-- le monde. On ne l'atteint plus que par les fonctions ci-dessous, qui
-- n'acceptent qu'une correspondance exacte et ne renvoient jamais de liste.
drop policy if exists "resoudre un code precis" on foyers;
drop policy if exists "creer son propre foyer" on foyers;

-- --- 4. Freinage de l'essai de codes ----------------------------------------

-- Un code fait 6 caractères sur un alphabet de 31, soit ~887 millions de
-- combinaisons : hors de portée à la main, mais énumérable par un script si
-- rien ne freine. Vingt essais par heure et par session suffisent à rendre
-- l'attaque sans intérêt, sans jamais gêner quelqu'un qui recopie un code
-- reçu par SMS.
create table if not exists tentatives_code (
  utilisateur uuid primary key references auth.users (id) on delete cascade,
  n           int not null default 0,
  depuis      timestamptz not null default now()
);

alter table tentatives_code enable row level security;
-- Aucune policy : seule la fonction `rejoindre_foyer` y touche.

-- --- 5. Les trois seules portes d'entrée ------------------------------------

/**
 * Crée un foyer et y inscrit l'appelant. Le code court est tiré côté base :
 * c'est le seul endroit qui peut vérifier son unicité sans exposer la table.
 */
create or replace function creer_foyer()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  nouveau   uuid := gen_random_uuid();
  alphabet  text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';  -- ni 0/O ni 1/I/l
  essai     text;
  i         int;
begin
  if auth.uid() is null then
    raise exception 'authentification requise';
  end if;

  for _tentative in 1..5 loop
    essai := '';
    for i in 1..6 loop
      essai := essai || substr(alphabet, floor(random() * length(alphabet))::int + 1, 1);
    end loop;

    begin
      insert into foyers (foyer, code) values (nouveau, essai);
      insert into membres (utilisateur, foyer) values (auth.uid(), nouveau);
      return jsonb_build_object('foyer', nouveau, 'code', essai);
    exception when unique_violation then
      -- Code déjà pris : on retire au prochain tour.
    end;
  end loop;

  raise exception 'impossible de générer un code unique';
end;
$$;

/**
 * Rejoint un foyer en présentant son code court. Renvoie l'UUID, ou null si
 * le code n'existe pas — jamais d'indice sur les codes voisins.
 */
create or replace function rejoindre_foyer(code_saisi text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  cible   uuid;
  essais  int;
begin
  if auth.uid() is null then
    raise exception 'authentification requise';
  end if;

  insert into tentatives_code (utilisateur, n, depuis)
    values (auth.uid(), 1, now())
  on conflict (utilisateur) do update
    set n      = case when tentatives_code.depuis < now() - interval '1 hour'
                      then 1 else tentatives_code.n + 1 end,
        depuis = case when tentatives_code.depuis < now() - interval '1 hour'
                      then now() else tentatives_code.depuis end
  returning n into essais;

  if essais > 20 then
    raise exception 'trop d''essais, réessayez dans une heure';
  end if;

  select foyer into cible from foyers where code = upper(trim(code_saisi));
  if cible is null then
    return null;
  end if;

  insert into membres (utilisateur, foyer) values (auth.uid(), cible)
    on conflict do nothing;

  return cible;
end;
$$;

/**
 * Rejoint un foyer en présentant directement son UUID. C'est la voie du lien
 * de partage (#/f/<uuid>) et celle des appareils déjà installés, qui
 * connaissent leur foyer sans jamais avoir eu de session. Présenter un UUID v4
 * complet reste la définition même de la capacité : impossible à deviner,
 * impossible à énumérer depuis que `foyers` est fermée.
 *
 * Renvoie false si le foyer n'existe pas — pour ne pas créer d'appartenance
 * vers un foyer fantôme sur une faute de frappe dans l'URL.
 */
create or replace function reclamer_foyer(uuid_foyer uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'authentification requise';
  end if;

  if not exists (select 1 from foyers where foyer = uuid_foyer) then
    return false;
  end if;

  insert into membres (utilisateur, foyer) values (auth.uid(), uuid_foyer)
    on conflict do nothing;

  return true;
end;
$$;

-- --- 6. Rattrapage des foyers sans code --------------------------------------

-- Un foyer créé pendant que l'app tournait sans Supabase configuré n'a
-- jamais eu de ligne ici : `creerFoyerAvecCode` rendait un UUID et un code
-- purement locaux. Ces foyers ont pourtant des listes et des recettes en
-- base, et `reclamer_foyer` les refuserait — l'appareil perdrait l'accès à
-- ses propres données au moment de la migration.
--
-- On les recrée donc à partir des identifiants réellement présents dans les
-- trois tables de données. Le code tiré ici ne correspondra pas à celui
-- affiché autrefois sur l'appareil, mais ce code-là ne menait nulle part :
-- il n'avait jamais été enregistré. Réglages montrera le nouveau.
do $$
declare
  f         uuid;
  alphabet  text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  essai     text;
  i         int;
begin
  for f in
    select foyer from listes
    union select foyer from recettes
    union select foyer from historiques
    except select foyer from foyers
  loop
    for _tentative in 1..10 loop
      essai := '';
      for i in 1..6 loop
        essai := essai || substr(alphabet, floor(random() * length(alphabet))::int + 1, 1);
      end loop;
      begin
        insert into foyers (foyer, code) values (f, essai);
        exit;
      exception when unique_violation then
        -- code déjà pris, on retire
      end;
    end loop;
  end loop;
end;
$$;

-- Doit renvoyer zéro : plus aucun foyer de données sans code.
--   select count(*) from (
--     select foyer from listes
--     union select foyer from recettes
--     union select foyer from historiques
--     except select foyer from foyers
--   ) manquants;

-- --- 7. Droits d'appel -------------------------------------------------------

-- `authenticated` couvre les sessions anonymes : elles ont un vrai
-- utilisateur. `anon` (sans session du tout) n'a rien à faire ici.
revoke all on function creer_foyer(), rejoindre_foyer(text), reclamer_foyer(uuid) from public, anon;
grant execute on function creer_foyer(), rejoindre_foyer(text), reclamer_foyer(uuid) to authenticated;

-- --- 8. Vérification ---------------------------------------------------------

-- Doit renvoyer les trois tables de données (la réplication temps réel évalue
-- la RLS ci-dessus : un non-membre ne recevra plus rien).
--   select tablename from pg_publication_tables where pubname = 'supabase_realtime';
--
-- Doit renvoyer zéro ligne, avec la clé anon et sans session :
--   select * from foyers;
--   select * from listes;

commit;

-- =============================================================================
-- Passe ensuite verification-apres.sql.
-- =============================================================================

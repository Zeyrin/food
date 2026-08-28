# FFFood

PWA pour choisir les repas de la semaine, en tirer une liste de courses, et cuisiner.
Pas de compte, pas de service payant, hors ligne en magasin.

## Ce qui a été décidé, et pourquoi

**Les recettes sont un fichier statique.** `src/data/recipes.json` est embarqué au build.
Pas de base de données pour le corpus, pas d'appel réseau pour l'afficher, et modifier une
recette est un commit. Le corpus est écrit à la main (voir plus bas) : c'est plus long à
constituer, mais chaque recette y est parce qu'on veut la manger.

**Un seul objet compte : le nom canonique d'un ingrédient.** C'est la clé sur laquelle
l'agrégation regroupe. Si deux recettes écrivent `crème fraîche` et `crème épaisse`, la
liste sort deux lignes et l'app perd son intérêt. `npm run lint:recipes` est là pour ça.

**Les favoris ne se déclarent pas.** La catégorie « Favoris » de l'écran Proposer réunit
deux gestes déjà faits : les plats notés « À refaire » à la fin d'une cuisson, et les
recettes que le foyer a écrites lui-même. Un cœur à cocher en plus n'aurait rien appris
de neuf — on n'ajoute pas une recette au catalogue par hasard — et aurait demandé un
troisième endroit où l'entretenir. « Jamais » l'emporte sur les deux : une recette maison
écartée après cuisson sort de la catégorie. Le partage suit : le verdict vit dans
l'historique du foyer, la recette dans son catalogue, donc les deux téléphones voient les
mêmes favoris (`src/lib/favoris.ts`).

**Pas de stock.** Un inventaire du placard suppose de déclarer chaque consommation, ce que
personne ne tient. À la place, l'écran Liste commence par une passe « ce que vous avez
déjà » : quinze secondes devant le frigo ouvert, et on récupère l'essentiel de la
soustraction sans jamais maintenir d'inventaire.

**Le partage se fait par lien, sans compte.** L'identifiant du foyer est un UUID v4. Qui a
le lien a la liste. C'est un modèle de capacité assumé — le contenu est une liste de
courses.

Ce modèle est appliqué par la base, pas par l'app. La distinction compte : les premières
policies étaient `using (true)` et laissaient le filtrage par foyer au client, alors que la
clé anon est publique par construction — n'importe qui pouvait donc énumérer tous les
foyers, lire toutes les listes et les effacer. Depuis
`supabase/migration-01-appartenance.sql`, chaque appareil ouvre une session anonyme
(invisible, toujours pas de compte), une table `membres` la relie aux foyers auxquels elle a
accès, et on n'y entre qu'en présentant le code court ou l'UUID exact. La table des codes
n'est plus lisible du tout ; les essais de code sont comptés.

Une conséquence à connaître avant de faire circuler un lien : **l'UUID est la clé**. Qui
l'obtient — par le lien `#/f/<uuid>` ou par le code à six caractères — entre dans le foyer
et y reste. Il n'y a pas de liste de membres à révoquer.

**L'écran d'accueil accepte les deux, et le dit.** Le code court et l'UUID sont les deux
seules entrées que la base reconnaît, mais un code voyage rarement nu : il arrive dans un
lien, dans un message, en minuscules, avec un espace de trop. Le champ de l'écran Bienvenue
prend donc la saisie telle qu'elle vient et décide de ce qu'elle est
(`src/lib/codeFoyer.ts`) — six caractères pour `rejoindre_foyer`, un UUID trouvé dans un
lien collé pour `reclamer_foyer`. Un lien sans foyer dedans ne se fait pas découper en un
code d'apparence valide : « https://fffood… » donnerait « HTTPSF » et un « code
introuvable » qui n'explique rien.

**Quitter un foyer ne l'oublie pas tout de suite.** Il reste joignable par son code, ce que
Réglages annonce déjà — mais retrouver ce code demandait d'aller le lire sur l'autre
téléphone. L'appareil garde donc de quoi rentrer (`foyerPrecedent` dans IndexedDB), et
l'écran d'accueil le propose en un bouton. Avec, à côté, de quoi l'effacer : on quitte aussi
une maison pour prêter son téléphone, et la note ne doit pas survivre à cette intention-là.

Basculer vers une autre maison depuis Réglages compte pour un départ : `rejoindreFoyer`
note la maison sortante au même titre que `quitterFoyer`. Sans ça, le code de la maison
d'avant disparaissait à l'instant précis où l'écran promettait qu'elle « resterait
accessible ». Une seule place, cela dit : « la maison d'avant » est une, pas un historique.

**Ce qui se rattrape se confirme.** Une saisie complète part toute seule sur l'écran
d'accueil — il n'y a rien à perdre, on n'est encore nulle part. Dans Réglages, la même
frappe changerait la maison partagée : une faute de frappe suffirait. La sixième case
remplie y ouvre donc une demande, et c'est le bouton qui l'exécute.

**Ce qui traverse le réseau est ce qui se décide à deux** : la liste (cases cochées,
produits écartés), le panier de la semaine qui voyage avec elle, le catalogue de recettes,
et l'historique de cuisson — « on a mangé ça mardi » vaut pour les deux téléphones. Chaque
appareil en garde une copie locale (IndexedDB) : en magasin, l'app fonctionne sans réseau,
et la synchro rattrape au retour.

**Une app qui ne peut rien enregistrer marche quand même.** Navigation privée stricte,
cookies tiers coupés, WebView verrouillée, quota atteint : IndexedDB rejette, et
l'amorçage — une suite d'`await` sur ces lectures — laissait l'app sur un écran blanc
définitif. L'absence de stockage est donc rendue indistinguable d'un stockage vide
(`src/lib/local.ts`) : on démarre, on oublie simplement d'une fois sur l'autre. Même
principe côté rendu, où une exception démontait tout l'arbre sans laisser un bouton :
`src/components/LimiteErreur.tsx` affiche de quoi recharger.

**Une lecture réseau qui échoue ne se déguise pas en réponse vide.** Un `select` refusé
rendait la même chose qu'un foyer neuf, avec des conséquences qui ne ressemblaient pas à
une panne : le catalogue entier réinséré en double à chaque ouverture, une liste décochée à
l'écran puis republiée vide, et un code de foyer parfaitement valide déclaré « introuvable »
parce que le téléphone était hors réseau. Les lectures de `src/lib/sync.ts` distinguent donc
les deux — quitte à retomber sur le corpus embarqué, qui garde l'app entièrement utilisable.

**Les minuteurs appartiennent à l'app, pas à l'écran de cuisson.** On lance un minuteur
précisément pour aller faire autre chose — vérifier un ingrédient sur la liste, répondre à
un message. Ils continuent donc de tourner quel que soit l'écran affiché, un bandeau les
rappelle partout, et ils survivent au rechargement (`src/lib/minuteurs.ts`). Quand l'app
n'est plus au premier plan, le navigateur suspend le son et ralentit les intervalles : une
notification système prend le relais, demandée au moment où l'utilisateur lance son premier
minuteur et jamais avant. L'étape en cours d'une recette est mémorisée de la même façon :
une séance interrompue se reprend.

## Mise en route

```bash
npm install
cp .env.example .env      # facultatif : sans ça, tout marche sauf le partage
npm run dev
```

Pour activer la liste partagée, dans un projet Supabase (offre gratuite) :

1. Authentication → Providers → **Anonymous sign-ins : activer**. Sans ça `auth.uid()` est
   nul et la base refuse tout.
2. Éditeur SQL → `supabase/schema.sql` (les tables ; elles en sortent fermées, sans policy)
3. Éditeur SQL → `supabase/verification-avant.sql` (lecture seule — noter les compteurs)
4. Éditeur SQL → `supabase/migration-01-appartenance.sql` (les policies et les trois RPC)
5. Éditeur SQL → `supabase/verification-apres.sql` (les compteurs doivent correspondre)
6. Database → Replication → cocher `listes`, `recettes`, `historiques`
7. Renseigner `.env`

La migration ne touche aucune donnée existante, s'exécute dans une transaction, et se
rejoue sans dommage. Elle a été éprouvée sur un PostgreSQL monté pour l'occasion, sur les
deux chemins : base neuve, et base déjà peuplée avec un foyer dépourvu de code — le cas où
un appareil aurait perdu l'accès à ses propres listes sans le rattrapage du §6.

Vérification qui ne ment pas : avec la clé anon et sans session, `select * from foyers` et
`select * from listes` doivent renvoyer zéro ligne.

## Vérifications

Trois commandes, à passer avant de committer :

```bash
npm test           # les invariants du code
npm run typecheck  # tests compris
npm run lint:recipes
```

Les tests sont des scripts `node:assert` lancés par le runner de Node — pas de framework,
pas de `describe`/`it` : un fichier qui lève est un test qui échoue. Ils portent sur les
fonctions où une régression ne se verrait pas à l'œil nu : l'agrégation et l'annotation des
étapes (`aggregate`), l'extraction du JSON collé (`collerRecettes`), le découpage par
magasin (`magasins`), les minuteurs devinés dans une étape (`duree`), le classement des
propositions (`propose`), le numéro de semaine ISO (`semaine`).

`i18n.test.ts` fait pour le dictionnaire ce que `lint:recipes` fait pour le corpus : les
deux langues portent les mêmes clés et les mêmes `{{variables}}`, et toute clé citée dans
le code existe. Sans lui, une traduction manquante est invisible — `t` retombe sur le
français et l'écran s'affiche.

Deux langues, donc, français et anglais (`src/lib/i18n.tsx`). La première ouverture suit
`navigator.language` ; ensuite c'est le réglage qui prime. Le texte produit hors composant
— unités de mesure, messages de validation du JSON collé — passe par `traduire`, qui lit la
langue courante sans contexte React : ces fonctions sont pures, appelées depuis quatre
écrans, et laissaient sinon des « c. à s. » au milieu d'une liste en anglais.

`npm run verifier` couvre en plus ce que les tests ne voient pas : la parité des clés fr/en,
les crédits photo, le domaine annoncé au même endroit partout, et la couverture de la
traduction du corpus — chaque recette doit avoir sa version anglaise avec le même nombre
d'étapes, chaque ingrédient et chaque tag leur entrée au glossaire.

## Écrire des recettes

Le format est décrit dans `src/types.ts`. Une recette :

```json
{
  "id": "dahl-lentilles-corail",
  "titre": "Dahl de lentilles corail",
  "temps": 30,
  "portions": 4,
  "tags": ["végé", "rapide"],
  "ingredients": [
    { "nom": "lentilles corail", "quantite": 250, "unite": "g", "rayon": "epicerie" },
    { "nom": "cumin moulu", "quantite": 1, "unite": "cc", "rayon": "epicerie", "placard": true }
  ],
  "etapes": ["Émincer l'oignon.", "…"]
}
```

Quatre règles qui font tenir le reste :

1. `nom` est un nom canonique, en minuscules, au singulier, sans marque ni conditionnement.
   `crème fraîche`, pas `crème fraîche épaisse Bridélice 20 cl`.
2. `rayon` est le rayon du magasin, jamais une enseigne : `fruits-legumes` et non
   « chez mon primeur ». Un même ingrédient garde le même rayon partout — `npm run
   lint:recipes` signale les désaccords.
3. `placard: true` pour ce qu'on a toujours (sel, poivre, huile, épices). Exclu de la liste
   de courses, mais affiché en mode cuisson.
4. Les quantités correspondent à `portions`. L'app fait la règle de trois.

**Le corpus est écrit en français, l'anglais vit à côté.** `src/data/recipes.en.json`
donne, par `id`, le titre et les étapes traduites ; `src/data/glossaire.en.json` traduit les
noms d'ingrédients et les tags, partagés par tout le corpus. Ajouter une recette veut donc
dire ajouter sa traduction : `npm run verifier` refuse une recette sans version anglaise, un
nombre d'étapes qui ne correspond pas, ou un ingrédient absent du glossaire.

La séparation n'est pas qu'une commodité de fichier. `nom` est la clé d'agrégation de la
liste de courses et de la synchro (`crème fraîche|cl`) : si elle changeait avec la langue,
deux téléphones réglés différemment couperaient la même ligne de liste en deux. La
traduction reste donc un habillage — `src/lib/traduireRecette.ts` rend un `affichage` à côté
du `nom`, et le reste de l'app continue de lire `nom` sans savoir qu'il y a deux langues.
Une recette collée par l'utilisateur n'est dans aucun des deux fichiers : elle s'affiche
telle qu'il l'a écrite, champ par champ, plutôt que de perdre une étape en route.

**Les photos aussi sont statiques.** `image` pointe sur `/plats/<id>.webp`, un
fichier de `public/plats/` livré avec le build et précaché par le service worker :
les photos tiennent hors ligne comme le reste, et aucun lien extérieur ne peut
mourir en laissant un cadre vide. Le format est du 800 × 600 en WebP. La
provenance de chacune est notée dans `public/credits.html`, page servie avec
l'app — les licences Creative Commons imposent de citer l'auteur, une liste
enfouie dans le dépôt n'y suffirait pas. Une recette sans photo reste valide :
la vignette teintée prend le relais.

**Ajouter une recette est une section de l'écran « Proposer »**, pas un écran à part.
On y regarde son catalogue : c'est là qu'on s'aperçoit qu'il manque un plat. La section
pose d'abord la seule question qui compte — l'écrire soi-même, ou la faire écrire — parce
que le cinquième onglet d'avant menait droit à un champ attendant du JSON, sans jamais
dire d'où ce JSON devait venir.

Le formulaire (`src/components/FormulaireRecette.tsx`) sert aussi à modifier une recette :
corriger « 250 g » en « 300 g » ne demande plus de retrouver la bonne accolade sur un
téléphone.

L'autre chemin (`src/components/CollageIA.tsx`) garde le collage : le prompt est fourni,
et la réponse se colle telle quelle — bloc ```` ```json ````, phrases avant/après et
tableau de plusieurs recettes sont acceptés, et une recette invalide dans un lot n'empêche
pas les autres d'entrer. Ses trois étapes disent explicitement celle qui se passe hors de
l'app : ouvrir ChatGPT ou Claude, coller, revenir.

Pour constituer le corpus en ligne de commande, demander explicitement la sortie dans
ce format, en fournissant la liste des noms déjà utilisés :

> Voici les noms d'ingrédients déjà présents dans mon corpus : [coller la sortie de
> `npm run lint:recipes`]. Propose-moi 5 recettes [critères], et renvoie-les en JSON au
> format ci-dessous, en réutilisant ces noms exacts quand l'ingrédient existe déjà.

Puis, systématiquement, avant de committer :

```bash
npm run lint:recipes
```

Le lint valide la structure, signale les quasi-doublons d'ingrédients, et repère un
ingrédient rangé dans deux rayons différents selon la recette.

## Rayons et magasins

**Une recette ne connaît que des rayons.** `RAYONS` (`src/types.ts`) énumère ce qu'on
traverse dans n'importe quel magasin : fruits & légumes, viande & poisson, crèmerie,
pain, épicerie, surgelés, boissons. C'est vrai pour tout le monde — une carotte est au
rayon légumes à Lille comme à Marseille — donc le corpus reste partageable. Une recette
qui dirait « Intermarché » ou « mon primeur » n'aurait de sens que pour son auteur.

**Le magasin, lui, est un réglage** (`src/lib/magasins.ts`). Par défaut il y en a un
seul, sans nom : la liste n'est alors qu'une suite de rayons, dans l'ordre où on les
traverse, ce qui va à la majorité des gens. Qui prend ses légumes au marché ajoute un
second magasin dans les réglages et lui affecte le rayon correspondant : la liste se
coupe en autant d'arrêts, dans l'ordre où on les fait. Les rayons non affectés vont au
premier magasin — on n'a donc jamais à tout router pour en déplacer un.

Ce réglage reste sur l'appareil et ne se synchronise pas : ce n'est pas une décision de
foyer (« on mange ça cette semaine »), mais la façon dont celui qui va faire les courses
organise son parcours. Ce qu'il y a à acheter, lui, reste identique des deux côtés.

Les recettes écrites avant les rayons portaient un champ `magasin` ; il est relu et
traduit à la volée (`src/lib/rayons.ts`), jamais réécrit.

## Le catalogue en HTML

**L'app est une SPA à une seule URL, et ça lui coûtait tout le référencement.**
Les écrans vivent dans une pile React (`Vue` dans `src/App.tsx`), jamais dans une adresse :
137 recettes écrites à la main, et rien d'indexable — chercher « dahl de lentilles corail »
ne pouvait pas mener ici, et le seul lien partageable était la racine.

`scripts/prerender.mjs` écrit donc, après `vite build`, une page statique par recette
(`/recette/<id>/`) plus l'index du catalogue (`/recette/`). Elles portent le contenu réel —
photo, ingrédients, quantités, étapes — leurs métadonnées de partage, et le balisage
`schema.org/Recipe` sans lequel un moteur affiche un lien bleu plutôt qu'une recette. Le
sitemap est généré avec elles : écrit à la main, il aurait ignoré la recette suivante.

Ces pages sont autonomes — pas de bundle, pas de React, style en ligne. Elles se lisent
telles quelles et renvoient vers l'app par `/#/r/<id>`, qui ouvre la fiche correspondante :
sans ce fragment, quelqu'un qui arrive de Google sur un plat précis atterrissait dans la
grille entière, à chercher ce qu'il venait de lire.

Deux détails les font tenir. Elles sont générées **après** `vite build`, donc elles
n'existent pas quand Workbox calcule son manifeste : les 137 pages restent hors du
précache, et le poids hors ligne de l'app ne bouge pas. Et `navigateFallbackDenylist`
(`vite.config.ts`) les exclut du repli SPA du service worker — sinon un visiteur qui a déjà
l'app installée recevait le catalogue au lieu de la recette qu'on venait de lui envoyer.

Le corollaire : `/recette/…` n'existe pas hors ligne, et c'est cohérent. Ce sont des pages
d'arrivée ; l'app, elle, reste servie depuis le cache à la racine.

Ces pages sont en français seulement. Le reste de l'app a deux langues parce qu'un
réglage se lit au moment de l'affichage ; une page écrite au build n'a pas de langue
courante à lire, et le corpus est écrit en français.

## Déploiement

`npm run build` produit un `dist/` statique. Cloudflare Pages ou GitHub Pages, tous deux
gratuits. Sur iOS, installer via Partager → Sur l'écran d'accueil.

### Mises à jour

Le service worker rend l'app utilisable hors ligne, mais fige la version installée :
tant que rien ne le pousse, un déploiement reste invisible sur le téléphone. Trois
mécanismes s'en chargent (`src/hooks/useMiseAJour.ts`) :

- **Vérification régulière** : au démarrage, à chaque retour au premier plan, au retour
  du réseau et toutes les dix minutes tant que l'app est ouverte.
- **Bascule automatique** quand personne ne regarde — pendant les huit premières
  secondes après un chargement (un rechargement suffit donc à passer à la dernière
  version) ou quand l'app est en arrière-plan.
- **Bandeau « Nouvelle version disponible »** le reste du temps : recharger l'écran en
  pleine cuisson ou au milieu d'une liste cochée en rayon fait perdre sa place, donc on
  propose au lieu d'imposer.

Les réglages affichent la version installée, un bouton pour vérifier tout de suite, et
en dernier recours « Réinstaller la dernière version » — qui supprime le service worker
et ses caches sans toucher au foyer, au panier ni à la liste (contrairement à
« supprimer les données de l'app » côté navigateur).

`vercel.json` complète le dispositif côté serveur : `sw.js`, `index.html` et le manifeste
sont revalidés à chaque requête, seuls les fichiers hachés de `assets/` sont mis en cache
durablement.

## Ce qui n'est pas fait

- Le planning par jour de la semaine — le panier est une liste, pas un calendrier
- Le déstockage (« que faire avec ce qui reste »), qui suppose un stock
- Un ordre de rayons réglable magasin par magasin — l'ordre est le même pour tous

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

**Pas de stock.** Un inventaire du placard suppose de déclarer chaque consommation, ce que
personne ne tient. À la place, l'écran Liste commence par une passe « ce que vous avez
déjà » : quinze secondes devant le frigo ouvert, et on récupère l'essentiel de la
soustraction sans jamais maintenir d'inventaire.

**Le partage se fait par lien, sans compte.** L'identifiant du foyer est un UUID v4 tiré
côté client. Qui a le lien a la liste. C'est un modèle de capacité assumé — le contenu est
une liste de courses.

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

Pour activer la liste partagée : créer un projet sur Supabase (offre gratuite), exécuter
`supabase/schema.sql` dans l'éditeur SQL, activer la réplication temps réel sur la table
`listes` (Database → Replication), puis renseigner `.env`.

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

## Ce qu'on mesure

**L'URL ne dit pas où on est, donc les écrans s'envoient à la main.** Rybbit découpe ses
statistiques par adresse, et l'app n'en a qu'une : ses quatre onglets, ses fiches et son
mode cuisson étaient indistinguables d'un `/`. On savait que des gens venaient, jamais
s'ils arrivaient jusqu'à la liste de courses. L'autre solution — faire changer l'URL au fil
des écrans, que Rybbit aurait suivie toute seule — a été écartée : on préfère des liens
propres. `src/lib/analytique.ts` envoie donc un événement `ecran` à chaque changement de
vue, et une poignée d'événements aux moments qui apprennent quelque chose : un plat mis au
panier, la dernière case de la liste cochée, un plat cuisiné jusqu'au verdict, une recette
ajoutée, un foyer créé ou rejoint, un minuteur lancé, l'app installée.

Le compteur de pages de Rybbit continue de tourner comme avant, sans y toucher : les
chiffres restent comparables d'un mois sur l'autre.

**Ce qui ne sort jamais.** L'identifiant de foyer et son code court sont le secret de
partage : les envoyer à un service tiers reviendrait à publier la clé de la liste. Rybbit
prend ce qui suit `#/` comme nom de page, et le lien qu'on envoie à son conjoint est
`#/f/<uuid>` — l'identifiant partait donc tel quel, et se serait affiché dans notre propre
rapport. `data-mask-patterns` (dans `index.html`) l'enregistre désormais comme `/f/*`. Le
texte libre ne sort pas non plus : un item tapé à la main dit ce qu'on achète. Restent des
identifiants de recettes, qui sont publics, et des compteurs.

`Evenements` est la liste complète et fermée : un nom qui n'y figure pas ne compile pas.
Sans ça, une faute de frappe crée un événement fantôme qu'on ne remarque qu'en cherchant,
des semaines plus tard, pourquoi la courbe est plate. Et `analytique.test.ts` garde
l'invariant qui compte : la mesure ne lève jamais. Le script manque chez plus de monde
qu'on ne croit — bloqueur de publicité, réseau coupé, `npm run dev` sans la balise — et un
compteur n'a pas le droit d'emporter un écran de cuisson.

## Déploiement

`npm run build` produit un `dist/` statique. Cloudflare Pages ou GitHub Pages, tous deux
gratuits. Sur iOS, installer via Partager → Sur l'écran d'accueil.

## Ce qui n'est pas fait

- Le planning par jour de la semaine — le panier est une liste, pas un calendrier
- Le déstockage (« que faire avec ce qui reste »), qui suppose un stock
- Un ordre de rayons réglable magasin par magasin — l'ordre est le même pour tous

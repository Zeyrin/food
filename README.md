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

**Ce qui traverse le réseau est ce qui se décide à deux** : la liste (cases cochées,
produits écartés), le panier de la semaine qui voyage avec elle, le catalogue de recettes,
et l'historique de cuisson — « on a mangé ça mardi » vaut pour les deux téléphones. Chaque
appareil en garde une copie locale (IndexedDB) : en magasin, l'app fonctionne sans réseau,
et la synchro rattrape au retour.

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
    { "nom": "lentilles corail", "quantite": 250, "unite": "g", "magasin": "primeur" },
    { "nom": "cumin moulu", "quantite": 1, "unite": "cc", "magasin": "intermarche", "placard": true }
  ],
  "etapes": ["Émincer l'oignon.", "…"]
}
```

Trois règles qui font tenir le reste :

1. `nom` est un nom canonique, en minuscules, au singulier, sans marque ni conditionnement.
   `crème fraîche`, pas `crème fraîche épaisse Bridélice 20 cl`.
2. `placard: true` pour ce qu'on a toujours (sel, poivre, huile, épices). Exclu de la liste
   de courses, mais affiché en mode cuisson.
3. Les quantités correspondent à `portions`. L'app fait la règle de trois.

**Les photos aussi sont statiques.** `image` pointe sur `/plats/<id>.webp`, un
fichier de `public/plats/` livré avec le build et précaché par le service worker :
les photos tiennent hors ligne comme le reste, et aucun lien extérieur ne peut
mourir en laissant un cadre vide. Le format est du 800 × 600 en WebP. La
provenance de chacune est notée dans `public/credits.html`, page servie avec
l'app — les licences Creative Commons imposent de citer l'auteur, une liste
enfouie dans le dépôt n'y suffirait pas. Une recette sans photo reste valide :
la vignette teintée prend le relais.

Depuis l'app (écran « Ajouter une recette »), le prompt est fourni et la réponse se colle
telle quelle : bloc ```` ```json ````, phrases avant/après et tableau de plusieurs recettes
sont acceptés, et une recette invalide dans un lot n'empêche pas les autres d'entrer.

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
ingrédient rangé dans deux magasins différents selon la recette.

## Magasins

Définis dans `src/types.ts` :

```ts
export const STORES = {
  intermarche: { label: 'Intermarché', order: 1 },
  primeur: { label: 'Primeur & asiat', order: 2 },
}
```

Ajouter une entrée suffit à créer un magasin. Pas de tri par rayon — la liste est
simplement séparée par magasin, dans l'ordre où on les fait.

## Déploiement

`npm run build` produit un `dist/` statique. Cloudflare Pages ou GitHub Pages, tous deux
gratuits. Sur iOS, installer via Partager → Sur l'écran d'accueil.

## Ce qui n'est pas fait

- Le planning par jour de la semaine — le panier est une liste, pas un calendrier
- Le déstockage (« que faire avec ce qui reste »), qui suppose un stock
- Un ordre de rayons dans le magasin

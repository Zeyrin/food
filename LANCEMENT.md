# Lancement — ce qu'un playbook de SaaS bootstrappé donne, appliqué à FFFood

## La note d'origine

Dix points, notés le 14 novembre 2025, qui décrivent la façon dont on lance un
micro-SaaS seul et rentable :

1. Prendre une idée déjà faite (jamais une idée neuve — trop risqué).
2. Décider ce qu'est un MVP « suffisant » — plus dur qu'il n'y paraît.
3. Proposer un deal à vie (LTD) et travailler avec les groupes Facebook LTD :
   giveaways, puis LTD privé.
4. Ne jamais offrir un compte. Toujours faire payer — un compte gratuit ne sert pas.
5. Faire tout le travail possible pour vendre un LTD privé.
6. Écrire du contenu. Beaucoup.
7. Lancer sur la place de marché AppSumo.
8. Faire un dernier LTD privé.
9. Demander des avis sur Trustpilot et équivalents.
10. Répondre aux questions sur Reddit et Quora.

## Pourquoi elle ne s'applique pas ligne à ligne

Ce playbook suppose trois choses que FFFood n'a pas, et n'a pas par décision, pas
par retard : **un compte**, **un back-end qui garde la valeur derrière une porte**,
et **un acheteur professionnel** qui amortit une licence sur son chiffre d'affaires.

FFFood est une PWA sans compte, dont le corpus de 137 recettes est embarqué au
build, dont le partage est un UUID que détient qui a le lien, et qui doit continuer
de marcher dans un magasin sans réseau. Il n'y a littéralement rien à déverrouiller
après un paiement : le catalogue est déjà dans le bundle installé.

Six des dix points (3, 4, 5, 7, 8, 9) tournent autour de cette porte qui n'existe
pas. Les appliquer à moitié — un compte « pour préparer le terrain », un tier payant
qui ne débloque rien — coûterait exactement ce qui fait tenir l'app aujourd'hui.
Le reste (1, 2, 6, 10) s'applique tel quel, et deux de ces quatre points sont
déjà à moitié construits sans qu'on les ait nommés ainsi.

Ce document dit, point par point, ce qu'on en garde.

## Point par point

### 1. Une idée déjà faite — ✅ acquis

Choisir quoi manger, en tirer une liste, cuisiner : la catégorie est encombrée
(Jow, Mealime, Paprika, Bring!, AnyList). C'est le point du playbook qui est déjà
satisfait, et il faut le lire comme tel : **il n'y a pas de risque de marché ici,
seulement un risque de distinction.**

La distinction ne vient pas de la catégorie mais des deux décisions du README : un
corpus écrit à la main — chaque recette y est parce qu'on veut la manger, pas parce
qu'un scraper l'a trouvée — et une app qui fonctionne hors ligne, sans compte, dans
un magasin. Toute la communication (points 6 et 10) parle de ces deux choses, jamais
de « planifier ses repas », qui ne distingue rien.

### 2. Un MVP « suffisant » — ✅ acquis, et à défendre

Le MVP existe et tourne : Proposer → Panier → Liste → Cuisson, 137 recettes, hors
ligne, partage par lien, deux langues. La section « Ce qui n'est pas fait » du README
(planning par jour, déstockage, ordre de rayons par magasin) **est** la frontière du
MVP, et elle tient. Le point du playbook — « plus dur que vous ne croyez » — ne
concerne donc plus le périmètre à atteindre mais celui à ne pas franchir : la
première demande d'un utilisateur extérieur sera le calendrier hebdomadaire. La
réponse est déjà écrite, elle est non.

Ce qui manque n'est pas une fonctionnalité, c'est une observation : **personne en
dehors du foyer n'a jamais fait tourner le parcours en entier.** Le test de
« suffisant » à passer avant tout le reste : un inconnu arrive sur le site, et
ressort avec une liste cochée en rayon, sans poser une seule question. L'écran
`Bienvenue`, le `TourGuide` et les 137 pages indexées sont là pour ça ; il reste à
vérifier qu'ils suffisent, sur un téléphone qui n'est pas le nôtre.

### 3, 5, 7, 8. La machinerie LTD — ❌ écartée

Un LTD vend un accès à vie à quelque chose dont l'acheteur serait privé sans payer.
FFFood n'a pas cette chose. Le corpus est statique et déjà téléchargé ; les
minuteurs, la liste, la cuisson tournent sur l'appareil ; le seul composant qui
coûte de l'argent au serveur est la synchro du foyer (Supabase, offre gratuite).

Vendre la synchro serait cohérent économiquement et incohérent avec le produit :
elle est aujourd'hui accessible par un lien, sans compte, et c'est ce qui la rend
utilisable à deux en trente secondes. La facturer, c'est y mettre une identité, donc
un compte, donc un chemin d'authentification à traverser avant la liste de courses
— pour un revenu qui, sur une app de foyer francophone, ne paiera pas le temps
passé à le construire.

Et AppSumo (point 7) vend des licences logicielles à des indépendants et des PME.
Une app de courses pour un foyer de deux personnes n'y a pas d'acheteur.

**Décision : pas de LTD, pas d'AppSumo, pas de compte.** À rouvrir seulement si la
synchro exige des comptes pour une autre raison (abus, quota Supabase dépassé) —
auquel cas un prix à vie sur le foyer redeviendrait la façon la plus honnête de
financer un coût qui existe déjà. Pas avant.

Ce qui survit du point 5, en revanche, est le vrai enseignement de la séquence :
**le travail non scalable passe avant la place de marché.** Mettre l'app entre les
mains de dix à vingt foyers, un par un, et regarder une vraie course se faire, vaut
mieux que n'importe quel lancement. C'est la version applicable du point 5, et elle
précède le point 6.

### 4. Ne jamais offrir un compte — ⚠️ transposé

Le fond du point est juste même sans compte : **une attention gratuite ne vaut
rien, et une installation gratuite ne prouve rien.** FFFood n'a pas de prix, donc
l'engagement rare à mesurer n'est pas le paiement mais l'usage réel.

La métrique qui compte n'est ni la visite ni l'installation : c'est **une liste
cochée en magasin**, puis une deuxième semaine. Rybbit est déjà branché
(`index.html`, pages prérendues) ; c'est cet événement-là qu'il faut savoir lire,
pas le nombre de pages vues. Tant qu'il ne se produit pas chez quelqu'un d'autre, les
points 6 et 10 amplifient un produit que personne n'a validé.

### 6. Écrire du contenu, beaucoup — ✅ le point central ici

C'est le point qui se transpose sans perte, et il est déjà à moitié construit :
`scripts/prerender.mjs` produit 137 pages statiques, l'index du catalogue, le
sitemap et le balisage `schema.org/Recipe`. Le contenu existe donc déjà — il n'a
simplement qu'une porte d'entrée : le nom du plat.

La suite se construit dans `prerender.mjs`, pas dans l'app, et sans rien inventer :
le corpus porte déjà les tags, les temps et des noms d'ingrédients canoniques que
`npm run lint:recipes` garantit uniques. De quoi générer les pages d'entrée par
intention, qui sont les requêtes réelles :

- par ingrédient — « que faire avec des lentilles corail », une page par nom
  canonique, alimentée par l'agrégation qui existe déjà ;
- par contrainte — végé, rapide, moins de 30 minutes, un seul plat ;
- par moment — ce qui se cuisine en semaine, ce qui tient pour six.

Trois règles héritées du README s'appliquent à ce contenu : il est **écrit au
build**, donc en français seulement ; il est **autonome** (pas de bundle, style en
ligne, aucun lien extérieur qui puisse mourir) ; et il **renvoie vers `/#/r/<id>`**,
jamais vers la racine — quelqu'un qui arrive sur un plat précis doit atterrir sur ce
plat.

Ce qui ne doit pas être écrit : des recettes générées pour remplir des pages. Le
corpus est écrit à la main, c'est la seule chose qui distingue l'app (point 1) ;
le diluer pour du volume SEO retire la raison de venir.

### 9. Demander des avis — ❌ sans objet

Trustpilot note des marchands, et les stores notent des applications installées
depuis un store. FFFood n'est ni l'un ni l'autre : pas de transaction, pas de fiche
d'app. Il n'y a pas de surface d'avis à alimenter, et en fabriquer une serait un
faux signal.

La preuve, ici, c'est le produit visible avant installation — les pages de recettes,
la page de crédits, le fait que le dépôt dise ce qui n'est pas fait. C'est plus
lent qu'une note à cinq étoiles, et ça ne se truque pas.

### 10. Répondre aux questions — ✅ applicable, et gratuit

Le pendant naturel du point 6 : la même connaissance qui remplit les pages (rayons,
quantités, ce qui se cuisine en 30 minutes) répond à de vraies questions sur Reddit
et les forums cuisine francophones. Coût nul, et ça fait rencontrer les utilisateurs
que le point 5 réclame.

Une limite, parce qu'elle est facile à franchir : **répondre là où FFFood répond
vraiment.** Un lien déposé dans chaque fil coûte exactement la crédibilité que
l'honnêteté du produit achète.

## Ce qu'on garde

| Point | Verdict |
|---|---|
| 1. Idée déjà faite | Acquis — communiquer sur le corpus à la main et le hors-ligne, pas sur la catégorie |
| 2. MVP suffisant | Acquis — défendre la frontière, refuser le calendrier |
| 3, 5, 7, 8. LTD / AppSumo | Écartés — rien à déverrouiller sans compte ; ne rouvrir que si la synchro impose des comptes |
| 4. Toujours faire payer | Transposé — mesurer la liste cochée en magasin, pas la visite |
| 6. Écrire du contenu | À faire — pages d'entrée par ingrédient, contrainte, moment, générées au build |
| 9. Avis Trustpilot | Sans objet — pas de transaction, pas de fiche d'app |
| 10. Reddit et forums | À faire — en pendant du point 6, sans dépôt de lien systématique |

## L'ordre

1. Faire tourner le parcours entier chez cinq foyers extérieurs, et regarder.
2. Corriger ce que ça révèle — et rien d'autre.
3. Étendre `prerender.mjs` aux pages d'entrée par intention.
4. Répondre aux questions là où l'app répond vraiment.

Les trois premiers points ne coûtent rien d'autre que du temps, et aucun ne demande
de revenir sur une décision du README. C'est le test : **un plan de diffusion qui
obligerait à ajouter un compte serait le mauvais plan.**

# Diagnostic — pourquoi ça bloque

*Écrit le 28 juillet 2026. Point de départ : ~1000 € par projet, 2 clients associatifs,
un retainer à 100 €/mois, pas de pipeline, trois apps perso non monétisées.*

## Le constat de départ, sans filtre

Trois apps construites par plaisir (Coup de Tête, l'app "quoi faire cet aprem", l'app
Courses), aucune monétisée. Une activité de prestation qui tourne à ~1000 € le projet, sur
le segment associatif — le segment le plus pauvre du marché. Un premier démarchage terrain
tenté chez un restaurateur, soldé par un silence. Sensation de "candy product" : créer pour
la stimulation de créer.

Le diagnostic tient en une phrase : **ce n'est pas un problème de compétence technique, ni
même un problème de marketing. C'est un problème de segment et de prix.**

## La preuve par le code

J'ai lu le repo de l'app Courses avant d'écrire quoi que ce soit. Ce que j'y ai trouvé :

- ~3200 lignes de TypeScript, architecture séparée proprement (`lib/` métier, `screens/`,
  `hooks/`), types explicites.
- Des **tests unitaires** sur la logique non triviale (agrégation des ingrédients, calcul de
  semaine, parsing de durées).
- Une PWA **offline-first réelle** : IndexedDB en local, fonctionnement total sans réseau en
  magasin, synchro qui rattrape au retour.
- De la **synchro temps réel** via Supabase, avec gestion des cas limites que la plupart des
  devs découvrent en production : collision de topic en StrictMode React, abonnement realtime
  qui échoue silencieusement, stratégie de résolution de conflit assumée et documentée
  (last-writer-wins, avec la justification écrite noir sur blanc).
- Des commentaires qui expliquent **pourquoi**, pas quoi. Un README qui justifie chaque
  décision d'architecture, y compris les décisions de *ne pas* faire (pas de base de données
  pour le corpus, pas de gestion de stock, et l'explication de ce que ça coûterait).

Ce n'est pas du code de débutante. Les arbitrages produit documentés dans `PARCOURS.md`
("pas de stock, parce que personne ne tient un inventaire ; à la place quinze secondes devant
le frigo ouvert") relèvent d'une compétence de **conception produit**, pas seulement
d'exécution technique.

**Une personne capable d'écrire ça ne vend pas des sites à 1000 €.** L'écart entre la valeur
produite et le prix pratiqué est le vrai sujet.

## Les trois erreurs identifiées

### 1. Tester son offre sur le segment le plus pauvre

Une association qui refuse 100 €/mois ne dit pas "c'est trop cher", elle dit "je n'ai pas de
budget" — ce qui est structurellement vrai pour la quasi-totalité des associations. Une
conclusion sur sa valeur a été tirée d'un test mené dans le désert.

Le même travail, vendu à quelqu'un pour qui il **rapporte de l'argent ou fait gagner du
temps mesurable**, change de prix sans changer de contenu.

### 2. Vendre un coût là où le concurrent vend un revenu

Le restaurateur paie 350 €/mois à TheFork sans broncher, et bégaie sur 150 €/mois pour un
site. Ce n'est pas de l'avarice : TheFork est rangé dans la colonne "ça me remplit des
tables", un site est rangé dans la colonne "brochure qui me coûte". Deux catégories mentales
différentes.

L'argument existait pourtant, et n'a pas été utilisé : **4200 €/an versés à TheFork, plus les
commissions par couvert, pour des clients dont TheFork garde les coordonnées.**

### 3. Brader dès la première résistance

Face au bégaiement : "le site je te l'offre, je l'ai déjà développé". Ce que ça communique :
*ceci ne vaut rien, et j'ai plus besoin de toi que tu n'as besoin de moi.* Un site gratuit n'a
ni valeur ni urgence — d'où le silence, qui n'est pas un rejet mais une absence d'enjeu.

Erreur aggravante : avoir **développé avant de vendre**. L'investissement était déjà consenti,
et ça se sentait dans la négociation.

## Ce qui n'est PAS le problème

- **La compétence technique.** Voir plus haut.
- **Le fait de coder des apps perso.** Ce sont des preuves de compétence utilisables
  commercialement, pas du temps perdu — à condition de les traiter comme telles.
- **Le "il s'en est battu les couilles de moi".** C'est l'état par défaut de ~90 % des
  prospects, y compris ceux qui achètent six mois plus tard. Un contact unique ne constitue
  pas un échantillon.

## Ce qui EST le problème

1. **Le segment** : associations et restaurants indépendants = budgets contraints, décision
   lente, ROI difficile à démontrer.
2. **Le prix** : sous le marché, et surtout sous le seuil de crédibilité. Un prix trop bas
   fait fuir les bons clients aussi sûrement qu'un prix trop haut fait fuir les mauvais.
3. **Le récurrent** : un seul retainer à 100 €/mois. Chaque vente remet le compteur à zéro au
   lieu d'élever le plancher.
4. **Le pipeline** : inexistant. Un prospect à la fois, donc chaque "non" pèse
   émotionnellement au lieu d'être une ligne dans un tableau.
5. **Le positionnement** : "je fais des sites web" est indifférenciable et se compare au prix.
   Le skill rare (offline-first + synchro temps réel) n'est vendu nulle part.

## La question à laquelle le reste du dossier répond

Comment passer de "survie" à un plancher mensuel stable, en utilisant les compétences
réellement possédées plutôt que celles qui se bradent — et avec un système de prospection
tenable pour quelqu'un qui n'aime ni la vidéo ni la vente ?

Suite : `01-marche-restaurants.md`, `02-marche-freelance.md`, `03-apps-metier.md`,
`04-prospection.md`, puis `05-plan.md` pour le plan d'exécution chiffré.

# Parcours utilisateur — app "Courses"

## Le besoin, en une phrase

Un foyer de 2 personnes qui a un catalogue de recettes vivant (généré au fil de l'eau via IA ou à la main) et qui s'en sert pour décider quoi manger, faire les courses, et cuisiner — sans que rien ne se perde dans une conversation IA éphémère.

## Deux jobs, poids égal

### Job 1 — Le catalogue grandit facilement
Aujourd'hui : demander à Claude "génère-moi des recettes végé pour l'été" → la réponse meurt dans la conversation.
Avec l'app : la même génération, mais le résultat colle direct dans le catalogue partagé.

**Flux** :
1. Demander à une IA des recettes, avec un prompt-template fourni par l'app (qui force le format `Recipe` exact : titre, temps, portions, tags, ingrédients avec quantités/unités/magasin, étapes).
2. Dans l'app, écran **Proposer** → bouton discret "Ajouter une recette".
3. Coller le JSON généré. L'app valide le format, l'ajoute à Supabase.
4. Elle rejoint immédiatement le même pool que les 16 recettes existantes — pas de statut "brouillon", pas de friction.

### Job 2 — Le run hebdomadaire (déjà construit, ne change pas)
**Proposer** (filtrer par temps/tags, ajouter au panier) → **Panier** (ajuster les portions) → **Liste** (trier ce qu'on a déjà, cocher en rayon, groupé par magasin) → **Cuisson** (étape par étape, quantités annotées, mode focus plein écran).

## Ce qui découle de ça pour la suite du travail

- Le style visuel (Material 3, épuré, peu importe) est un **habillage**, pas le problème central — on le tranche une fois que le Job 1 existe, pas avant.
- Prochaine étape technique concrète : brancher Supabase pour de vrai (jusqu'ici configuré mais pas connecté — cf. conversation précédente), car le Job 1 en dépend directement pour que les recettes ajoutées soient partagées entre les deux téléphones.
- Le prompt-template à donner à l'IA est un livrable à écrire : il doit produire un JSON qui matche exactement `types.ts` (`Recipe`), sinon l'ajout échoue à la validation.

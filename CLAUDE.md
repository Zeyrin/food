# CLAUDE.md

## Préférences

**Ne jamais supposer d'attribut personnel non déclaré.** Le mainteneur de ce dépôt est un
homme (il/lui). Plus généralement : quand une caractéristique personnelle n'a pas été énoncée
— genre, âge, statut, niveau d'expérience, situation — soit on la demande, soit on écrit de
façon neutre. On ne la déduit ni d'un prénom, ni d'un domaine d'activité, ni du ton d'un
message, ni de statistiques sur une population.

Cette règle vaut pour tout ce qui est produit, pas seulement pour la conversation : documents,
modèles d'emails, commentaires de code, messages de commit.

## Le projet

`food` — PWA de gestion de cuisine : choix des recettes, liste de courses, panier en magasin,
tutoriel de cuisson. React/TypeScript, offline-first (IndexedDB), synchro temps réel via
Supabase. Voir `README.md` pour les décisions d'architecture et `PARCOURS.md` pour le parcours
utilisateur.

`business/` — dossier de repositionnement commercial, sans lien avec le code de l'application.
Point d'entrée : `business/HANDOFF.md`.

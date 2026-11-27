# Guides : règles d'écriture et mots-clés à traiter

Les guides (`src/data/guides/*.md`, rendus par `scripts/prerender.mjs`) font venir
sur fffood.fr des gens qui cherchent quoi cuisiner, et les amènent vers l'app.
Le format est décrit en tête de `scripts/guides.mjs`.

## Règles

- **Un guide = une requête** qu'on tape vraiment dans Google, notée dans `mot_cle`.
  Deux guides ne visent jamais la même (la validation le refuse) : on enrichit
  l'existant plutôt que d'en écrire un second.
- **Tout ce qu'on affirme se vérifie dans `src/data/recipes.json`** : temps,
  parts, quantités, ingrédients. Pas de prix, de calories ni de chiffres
  inventés. Si une donnée manque, on n'en parle pas.
- **Le guide apporte quelque chose qu'une liste de recettes n'apporte pas** :
  un ordre, une méthode, des ingrédients qui se partagent, des conseils de
  conservation, de vraies astuces de cuisson. Pas de remplissage, pas de
  phrases génériques.
- **Uniquement des recettes du catalogue**, avec au moins 4 cartes `{{recette …}}`.
  Un guide qui compose un menu a un champ `menu` (le bouton « mettre dans mon panier »).
- **Liens internes** : au moins un lien vers un autre guide quand c'est pertinent.
- Titre de page ≤ 60 caractères (`titre_seo`), description ≤ 160.
- Français, tutoiement exclu (on vouvoie, comme dans l'app).
- Avant de proposer : `npm run lint:guides` puis `npm run build`.

## Mots-clés à traiter

Cochés une fois publiés. Quand Google Search Console sera connecté, on
priorisera les requêtes où le site apparaît déjà sans être cliqué.

- [x] menu de la semaine
- [x] que manger ce soir
- [ ] repas pas cher pour une famille
- [x] menu végétarien de la semaine
- [ ] batch cooking de la semaine
- [ ] menu de la semaine pour 2
- [ ] que faire avec des restes de riz
- [ ] plat mijoté facile pour le week-end
- [ ] recettes avec des lentilles
- [ ] idées de dîner léger
- [ ] menu de la semaine en hiver
- [ ] recettes thaïes faciles à la maison
- [ ] que faire avec du chou-fleur
- [ ] recettes avec des œufs pour le dîner
- [ ] idées de repas avec du poisson
- [ ] recettes de pommes de terre faciles
- [ ] desserts faciles de grand-mère
- [ ] entrées faciles pour recevoir
- [ ] plats du dimanche en famille
- [ ] repas sans four

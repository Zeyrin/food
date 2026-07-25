# Brief — app "Courses"

## Quoi

PWA mobile (installable, offline) pour un foyer de 2 personnes qui gère : choisir des recettes, ajuster les portions, générer une liste de courses groupée par magasin, et cuisiner en suivant les étapes sur le téléphone. Synchro temps réel entre les deux téléphones (une liste partagée, pas de comptes).

16 recettes actuellement (ex : Mapo tofu, Falafel bowl, Bowl quinoa & légumes rôtis), chacune avec temps, portions, tags (ex : "asiatique", "végé", "rapide"), liste d'ingrédients avec quantités, et étapes de préparation texte.


## 4 écrans

1. **Proposer** — feed de recettes suggérées (filtrable par temps max / tags), on touche une carte pour l'ajouter au panier de la semaine.
2. **Panier** — recettes retenues, réglage du nombre de parts par recette (compteur +/-), bouton vers la liste.
3. **Liste** — deux temps : (a) "tri" rapide devant le frigo pour écarter ce qu'on a déjà, (b) liste de courses groupée par rayon/magasin, à cocher en marchant dans les rayons.
4. **Cuisson** — mode plein écran étape par étape : aperçu ingrédients + toutes les étapes, puis navigation une étape à la fois avec la quantité de l'ingrédient concerné surlignée dans le texte de l'étape. Écran de fin pour noter "à refaire" / "jamais".

## Contraintes d'usage réelles (non négociables)

- **Mains sales / gouttes d'eau** en mode Cuisson : cibles tactiles ≥ 56px, gros texte, peu de gestes fins.
- **Lu à distance** (téléphone posé sur le plan de travail, pas tenu) : contraste fort, tailles de police généreuses en mode Cuisson.
- **Dans un rayon de supermarché** (lumière crue, on va vite) : la liste de courses doit se lire et se cocher en un coup d'œil, aucune info seulement portée par la couleur (accessibilité).
- Dark mode et light mode tous les deux réels, pas juste inversion de couleurs.

## Direction visuelle voulue

**Material Design 3 (Google)**, dans l'esprit d'apps comme Wonders / apps de livraison/recettes modernes :
- Cartes à gros radius (16–28px), généreuses en respiration.
- Chips colorées pour tags/filtres/métadonnées (temps, portions).
- Palette expressive mais pas criarde — des couleurs qui structurent l'info, pas juste décoratives.
- Transitions animées marquées entre états (ouverture d'une recette, passage d'étape en mode Cuisson, coche d'un item de liste) — effet "shared element" bienvenu.
- Un mode Cuisson qui peut avoir sa propre identité plus sombre/contrastée, façon écran "focus", indépendant du thème clair/sombre du reste de l'app.

## Ce qu'on ne veut PAS

- Pas de look "site web" plat — doit se sentir comme une app native.
- Pas de dépendance à de vraies photos de plats.
- Pas de sur-décoration qui nuit à la vitesse d'usage dans les 3 contextes ci-dessus (cuisine, rayon, plan de travail).

import { UNITS } from '../types'

/**
 * Prompt à copier-coller dans une IA (Claude, ChatGPT…) pour obtenir
 * une recette directement au format attendu par l'app — colle le
 * JSON de réponse dans l'écran « Saisie automatique », rien à
 * retaper à la main.
 */
export function genererPrompt(demande: string): string {
  return `Génère une ou plusieurs recettes de cuisine au format JSON strict, sans aucun texte autour (pas de markdown, pas de \`\`\`json, juste le JSON brut). Pour plusieurs recettes, renvoie un tableau JSON d'objets au même format.

Demande : ${demande || "une recette au choix"}

Format exact attendu (pour une recette ; plusieurs = un tableau de ces objets) :
{
  "titre": "string",
  "temps": nombre de minutes (total, du plan de travail à l'assiette),
  "portions": nombre de parts que couvrent les quantités ci-dessous,
  "tags": ["quelques mots-clés libres, ex: asiatique, végé, rapide, four"],
  "ingredients": [
    { "nom": "string (nom canonique, sans quantité dedans)", "quantite": nombre, "unite": "une valeur parmi ${UNITS.join(', ')}", "magasin": "intermarche ou primeur (primeur = fruits/légumes/produits asiatiques frais, intermarche = le reste)" }
  ],
  "etapes": ["une string par étape, dans l'ordre, texte clair et complet, avec les ingrédients entre accolades : \\"Cuire les {pâtes} dans l'eau salée\\""],
  "description": "une phrase courte qui donne envie (optionnel)",
  "astuces": ["un tour de main par étape, même ordre que etapes, chaîne vide si rien à dire (optionnel)"]
}

Contraintes :
- "unite" doit être exactement une des valeurs listées, rien d'autre.
- "magasin" doit être exactement "intermarche" ou "primeur".
- Les quantités sont des nombres (pas de fractions texte comme "1/2", utilise 0.5).
- Le sel, poivre, huile courants peuvent avoir "placard": true en plus des autres champs (optionnel).
- Dans les étapes, entoure d'accolades chaque mention d'un ingrédient de la liste : l'app affiche la dose juste après. Écris le mot tel qu'il doit se lire — les accolades disparaissent à l'affichage, et le texte à l'intérieur peut différer du "nom" canonique : { "nom": "pâtes longues" } se cite « les {pâtes} », { "nom": "oignon nouveau" } se cite « les {oignons nouveaux} ».
- N'entoure pas une mention partielle ou indirecte : « la moitié du reblochon », « le reste des herbes », « la sauce » quand il s'agit de celle qu'on est en train de faire. Sans accolades, aucune dose n'est affichée — c'est le comportement voulu dans ces cas.
- N'entoure pas non plus les ingrédients de placard (sel, poivre, huile courante) : leur dose n'intéresse personne en cours de cuisson.`
}

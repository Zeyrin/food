import { RAYONS, UNITS, type RayonId } from '../types'
import { traduireEn, type Langue } from './i18n'

/** « fruits-legumes (Fruits & légumes), … » — de quoi choisir sans deviner. */
const RAYONS_DECRITS = (Object.keys(RAYONS) as RayonId[])
  .filter((r) => r !== 'autre')
  .map((r) => `${r} (${RAYONS[r].label})`)
  .join(', ')

/** Les mêmes, libellés en anglais : les identifiants, eux, ne changent pas. */
const RAYONS_DECRITS_EN = (Object.keys(RAYONS) as RayonId[])
  .filter((r) => r !== 'autre')
  .map((r) => {
    const libelle = traduireEn('en', `rayons.${r}`)
    return `${r} (${libelle === `rayons.${r}` ? RAYONS[r].label : libelle})`
  })
  .join(', ')

/**
 * Prompt à copier-coller dans une IA (Claude, ChatGPT…) pour obtenir
 * une recette directement au format attendu par l'app — la réponse se
 * recolle dans la section « Ajouter une recette » de l'écran
 * « Proposer », rien à retaper à la main.
 */
export function genererPrompt(demande: string, langue: Langue = 'fr'): string {
  if (langue === 'en') return promptAnglais(demande)
  return `Génère une ou plusieurs recettes de cuisine au format JSON strict, sans aucun texte autour (pas de markdown, pas de \`\`\`json, juste le JSON brut). Pour plusieurs recettes, renvoie un tableau JSON d'objets au même format.

Demande : ${demande || "une recette au choix"}

Format exact attendu (pour une recette ; plusieurs = un tableau de ces objets) :
{
  "titre": "string",
  "temps": nombre de minutes (total, du plan de travail à l'assiette),
  "portions": nombre de parts que couvrent les quantités ci-dessous,
  "tags": ["quelques mots-clés libres, ex: asiatique, végé, rapide, four"],
  "ingredients": [
    { "nom": "string (nom canonique, sans quantité dedans)", "quantite": nombre, "unite": "une valeur parmi ${UNITS.join(', ')}", "rayon": "une valeur parmi ${RAYONS_DECRITS}" }
  ],
  "etapes": ["une string par étape, dans l'ordre, texte clair et complet, avec les ingrédients entre accolades : \\"Cuire les {pâtes} dans l'eau salée\\""],
  "description": "une phrase courte qui donne envie (optionnel)",
  "astuces": ["un tour de main par étape, même ordre que etapes, chaîne vide si rien à dire (optionnel)"]
}

Contraintes :
- "unite" doit être exactement une des valeurs listées, rien d'autre.
- "rayon" est le rayon du magasin où l'ingrédient se trouve, jamais une enseigne : le même ingrédient doit recevoir le même rayon d'une recette à l'autre. Dans le doute, "epicerie".
- Les quantités sont des nombres (pas de fractions texte comme "1/2", utilise 0.5).
- Le sel, poivre, huile courants peuvent avoir "placard": true en plus des autres champs (optionnel).
- Dans les étapes, entoure d'accolades chaque mention d'un ingrédient de la liste : l'app affiche la dose juste après. Écris le mot tel qu'il doit se lire — les accolades disparaissent à l'affichage, et le texte à l'intérieur peut différer du "nom" canonique : { "nom": "pâtes longues" } se cite « les {pâtes} », { "nom": "oignon nouveau" } se cite « les {oignons nouveaux} ».
- N'entoure pas une mention partielle ou indirecte : « la moitié du reblochon », « le reste des herbes », « la sauce » quand il s'agit de celle qu'on est en train de faire. Sans accolades, aucune dose n'est affichée — c'est le comportement voulu dans ces cas.
- N'entoure pas non plus les ingrédients de placard (sel, poivre, huile courante) : leur dose n'intéresse personne en cours de cuisson.`
}

/**
 * La même consigne pour qui utilise l'app en anglais : la recette revient
 * rédigée en anglais. Les noms de champs (`titre`, `etapes`…), les unités
 * et les rayons restent les identifiants de l'app — c'est eux que lit
 * `validerRecette`.
 */
function promptAnglais(demande: string): string {
  return `Generate one or more cooking recipes as strict JSON, with no text around it (no markdown, no \`\`\`json, just the raw JSON). For several recipes, return a JSON array of objects in the same format. Write all text (title, ingredient names, steps…) in English, but keep the field names exactly as below.

Request: ${demande || 'any recipe you like'}

Exact expected format (for one recipe; several = an array of these objects):
{
  "titre": "string (the recipe title)",
  "temps": number of minutes (total, from worktop to plate),
  "portions": number of servings the quantities below cover,
  "tags": ["a few free keywords, e.g. asian, veggie, quick, oven"],
  "ingredients": [
    { "nom": "string (canonical name, no quantity in it)", "quantite": number, "unite": "one value among ${UNITS.join(', ')}", "rayon": "one value among ${RAYONS_DECRITS_EN}" }
  ],
  "etapes": ["one string per step, in order, clear and complete, with ingredients in curly braces: \\"Cook the {pasta} in salted water\\""],
  "description": "a short, appetising sentence (optional)",
  "astuces": ["one tip per step, same order as etapes, empty string if nothing to say (optional)"]
}

Constraints:
- "unite" must be exactly one of the listed values, nothing else (cs = tablespoon, cc = teaspoon, pincee = pinch, botte = bunch, piece = item).
- "rayon" is the store aisle where the ingredient is found, never a store brand: the same ingredient must get the same aisle from one recipe to the next. When in doubt, "epicerie".
- Quantities are numbers (no text fractions like "1/2", use 0.5).
- Common salt, pepper and oil may have "placard": true on top of the other fields (optional).
- In the steps, wrap in curly braces each mention of an ingredient from the list: the app shows the amount right after it. Write the word as it should read — the braces disappear on screen, and the text inside may differ from the canonical "nom": { "nom": "spring onion" } can be cited as "the {spring onions}".
- Do not wrap a partial or indirect mention: "half the cheese", "the rest of the herbs", "the sauce" when it is the one being made. Without braces no amount is shown — that is the intended behaviour in those cases.
- Do not wrap pantry staples either (salt, pepper, everyday oil): nobody needs their amount while cooking.`
}

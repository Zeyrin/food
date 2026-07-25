import { UNITS } from '../types'

/**
 * Prompt à copier-coller dans une IA (Claude, ChatGPT…) pour obtenir
 * une recette directement au format attendu par l'app — colle le
 * JSON de réponse dans l'écran « Saisie automatique », rien à
 * retaper à la main.
 */
export function genererPrompt(demande: string): string {
  return `Génère une recette de cuisine au format JSON strict, sans aucun texte autour (pas de markdown, pas de \`\`\`json, juste l'objet JSON brut).

Demande : ${demande || "une recette au choix"}

Format exact attendu :
{
  "titre": "string",
  "temps": nombre de minutes (total, du plan de travail à l'assiette),
  "portions": nombre de parts que couvrent les quantités ci-dessous,
  "tags": ["quelques mots-clés libres, ex: asiatique, végé, rapide, four"],
  "ingredients": [
    { "nom": "string (nom canonique, sans quantité dedans)", "quantite": nombre, "unite": "une valeur parmi ${UNITS.join(', ')}", "magasin": "intermarche ou primeur (primeur = fruits/légumes/produits asiatiques frais, intermarche = le reste)" }
  ],
  "etapes": ["une string par étape, dans l'ordre, texte clair et complet"]
}

Contraintes :
- "unite" doit être exactement une des valeurs listées, rien d'autre.
- "magasin" doit être exactement "intermarche" ou "primeur".
- Les quantités sont des nombres (pas de fractions texte comme "1/2", utilise 0.5).
- Le sel, poivre, huile courants peuvent avoir "placard": true en plus des autres champs (optionnel).
- Les étapes citent les ingrédients par leur nom exact tel qu'écrit dans "ingredients", pour que l'app puisse y accrocher les quantités automatiquement.`
}

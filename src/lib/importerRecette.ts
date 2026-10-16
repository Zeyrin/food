import type { Recipe } from '../types'
import { traduire } from './i18n'
import { analyserIngredient } from './ingredientTexte'
import type { RecetteWeb } from './jsonLdRecette'
import { pageSite } from './plateforme'

/**
 * Importer une recette depuis son adresse web.
 *
 * Le navigateur ne peut pas lire la page d'un autre site (CORS) : c'est la
 * fonction serveur `api/importer-recette.ts` qui la télécharge et en tire
 * la recette. Hors ligne, ou si le site n'en publie pas, l'erreur est
 * dite telle quelle — les autres chemins d'ajout restent ouverts.
 */

/** Une adresse collée avec du bruit autour (« Regarde ça https://… ! ») → l'adresse seule. */
export function extraireUrl(saisie: string): string | null {
  const m = saisie.match(/https?:\/\/[^\s<>"']+/i) ?? saisie.trim().match(/^(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/\S*)?$/i)
  if (!m) return null
  const brut = m[0].replace(/[).,;!?]+$/, '')
  const url = /^https?:\/\//i.test(brut) ? brut : `https://${brut}`
  try {
    return new URL(url).href
  } catch {
    return null
  }
}

/** La recette lue sur la page, mise au format de l'app. Le formulaire fait relire le reste. */
export function brouillonDepuisWeb(web: RecetteWeb, source: string): Recipe {
  return {
    id: crypto.randomUUID(),
    titre: web.titre,
    temps: web.temps,
    portions: web.portions > 0 ? web.portions : 2,
    tags: web.tags,
    ingredients: web.ingredients.map(analyserIngredient),
    etapes: web.etapes,
    ...(web.description ? { description: web.description } : {}),
    source,
  }
}

export async function importerDepuisUrl(url: string): Promise<Recipe> {
  let reponse: Response
  try {
    reponse = await fetch(pageSite(`/api/importer-recette?url=${encodeURIComponent(url)}`))
  } catch {
    throw new Error(traduire('import.erreurReseau'))
  }
  if (!reponse.ok) {
    const corps = (await reponse.json().catch(() => null)) as { erreur?: string } | null
    throw new Error(corps?.erreur ?? traduire('import.erreurServeur'))
  }
  return brouillonDepuisWeb((await reponse.json()) as RecetteWeb, url)
}

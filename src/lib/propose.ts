import type { Recipe, Verdict } from '../types'

export interface Criteres {
  /** Ne garder que les recettes tenant dans ce temps. */
  tempsMax?: number
  /** Au moins un de ces tags. Vide = pas de filtre. */
  tags?: string[]
  /** Combien de propositions renvoyer. */
  nombre?: number
}

export interface Historique {
  /** recipeId → timestamp de la dernière fois cuisinée. */
  derniereFois: Record<string, number>
  /** recipeId → verdict après cuisson. */
  verdicts: Record<string, Verdict>
}

const JOUR = 86_400_000

/**
 * Le « hasard » du classement, en fait déterministe : `Math.random()`
 * retirait un nombre neuf à chaque calcul, donc à chaque remontage de
 * l'écran. Passer au Panier et revenir rebattait toute la grille — on
 * cherchait une recette repérée trente secondes plus tôt et elle avait
 * changé de place.
 *
 * Le tirage dépend donc de la recette et du jour : l'ordre tient pendant
 * qu'on compose sa semaine, et change quand même d'un jour à l'autre —
 * ce que le hasard servait à obtenir.
 */
function tirage(recipeId: string, jour: number): number {
  let h = jour * 2654435761
  for (let i = 0; i < recipeId.length; i++) h = (Math.imul(h, 31) + recipeId.charCodeAt(i)) >>> 0
  return (h % 100000) / 100000
}

/**
 * Choisit des recettes dans le corpus.
 *
 * Ce n'est pas de la recommandation savante : trois signaux
 * suffisent — écarter ce qui a été rejeté, éviter ce qui vient
 * d'être mangé, remonter ce qui a plu. Le hasard fait le reste,
 * sinon on retombe toujours sur les quatre mêmes plats.
 */
export function proposer(recipes: Recipe[], historique: Historique, criteres: Criteres = {}): Recipe[] {
  const { tempsMax, tags = [], nombre = 8 } = criteres
  const maintenant = Date.now()
  const jour = Math.floor(maintenant / JOUR)

  const candidats = recipes
    .filter((r) => historique.verdicts[r.id] !== 'jamais')
    .filter((r) => (tempsMax ? r.temps <= tempsMax : true))
    .filter((r) => (tags.length ? tags.some((t) => r.tags.includes(t)) : true))

  const scored = candidats.map((r) => {
    let score = tirage(r.id, jour)

    const derniere = historique.derniereFois[r.id]
    if (derniere !== undefined) {
      const jours = (maintenant - derniere) / JOUR
      // Rejeté sous 30 jours, puis remonte progressivement.
      if (jours < 30) score -= 1.5 * (1 - jours / 30)
    }

    if (historique.verdicts[r.id] === 'refaire') score += 0.4

    return { recipe: r, score }
  })

  return scored
    // Une recette sans photo tombe sur le placeholder générique : la
    // grille se lit mieux si les plats illustrés passent en premier,
    // avant même le score. À égalité de photo, le score déjà en place
    // tranche — l'identifiant en tout dernier recours (deux recettes
    // jamais cuisinées peuvent tomber sur le même tirage), sans ça
    // l'ordre dépendrait de la stabilité du tri, donc du moteur.
    .sort(
      (a, b) =>
        (b.recipe.image ? 1 : 0) - (a.recipe.image ? 1 : 0) ||
        b.score - a.score ||
        a.recipe.id.localeCompare(b.recipe.id),
    )
    .slice(0, nombre)
    .map((s) => s.recipe)
}

/**
 * Cuisiné dans les derniers jours. Le panier couvre une semaine : au
 * sein de cette fenêtre, « déjà fait » est une information utile (quel
 * plat reste-t-il à cuisiner ?) alors que le mois dernier ne dit plus
 * rien sur la semaine en cours.
 */
export function cuisineRecemment(historique: Historique, recipeId: string, jours = 7): boolean {
  const derniere = historique.derniereFois[recipeId]
  return derniere !== undefined && Date.now() - derniere < jours * JOUR
}

/** Tous les tags présents dans le corpus, pour construire les filtres. */
export function tousLesTags(recipes: Recipe[]): string[] {
  return [...new Set(recipes.flatMap((r) => r.tags))].sort((a, b) => a.localeCompare(b, 'fr'))
}

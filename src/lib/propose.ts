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

  const candidats = recipes
    .filter((r) => historique.verdicts[r.id] !== 'jamais')
    .filter((r) => (tempsMax ? r.temps <= tempsMax : true))
    .filter((r) => (tags.length ? tags.some((t) => r.tags.includes(t)) : true))

  const scored = candidats.map((r) => {
    let score = Math.random()

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
    .sort((a, b) => b.score - a.score)
    .slice(0, nombre)
    .map((s) => s.recipe)
}

/** Tous les tags présents dans le corpus, pour construire les filtres. */
export function tousLesTags(recipes: Recipe[]): string[] {
  return [...new Set(recipes.flatMap((r) => r.tags))].sort((a, b) => a.localeCompare(b, 'fr'))
}

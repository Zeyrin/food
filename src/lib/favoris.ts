import corpus from '../data/recipes.json'
import type { Recipe } from '../types'
import type { Historique } from './propose'

/**
 * Les favoris ne se déclarent pas : ils se déduisent de ce qui a déjà été
 * fait. Deux gestes valent « on aime » — répondre « À refaire » après
 * avoir cuisiné, et prendre le temps d'écrire soi-même une recette. Un
 * cœur à cocher en plus de ça n'aurait rien appris de neuf, et aurait
 * demandé un troisième endroit où l'entretenir.
 */

/**
 * Les recettes livrées avec l'app. Une fois le foyer semé, le catalogue
 * Supabase mélange corpus et recettes maison dans la même table, sans rien
 * qui les distingue : l'appartenance au corpus est donc le seul signal
 * disponible. Il a l'avantage de valoir rétroactivement — les recettes
 * collées avant l'existence des favoris y entrent sans migration — et
 * d'être sans ambiguïté : une recette collée reçoit un UUID
 * (validerRecette), jamais un identifiant lisible comme ceux du corpus.
 */
const IDS_CORPUS = new Set((corpus as Recipe[]).map((r) => r.id))

/** Écrite par le foyer depuis l'écran « Ajouter une recette ». */
export function ajouteeParLeFoyer(recette: Recipe): boolean {
  return !IDS_CORPUS.has(recette.id)
}

export function estFavorite(recette: Recipe, historique: Historique): boolean {
  // « Jamais » a le dernier mot, y compris sur une recette maison : on l'a
  // écrite, cuisinée, et décidé de ne plus la refaire. La garder en favori
  // la remettrait sous les yeux à chaque semaine.
  if (historique.verdicts[recette.id] === 'jamais') return false
  return historique.verdicts[recette.id] === 'refaire' || ajouteeParLeFoyer(recette)
}

/** La catégorie, dans l'ordre reçu. */
export function favoris(recipes: Recipe[], historique: Historique): Recipe[] {
  return recipes.filter((r) => estFavorite(r, historique))
}

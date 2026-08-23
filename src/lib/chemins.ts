import type { Onglet, Recipe } from '../types'

/**
 * Un seul écran affiché à la fois, mais empilé plutôt que dans des
 * flags séparés : « reculer » devient « dépiler », que ce soit via un
 * bouton de l'appli ou le bouton retour du téléphone/navigateur. Sans
 * ça, l'appli n'a qu'une seule page dans l'historique du navigateur —
 * retour en sort directement au lieu de reculer d'un écran.
 */
export type Vue =
  | { type: 'onglet'; onglet: Onglet }
  | { type: 'detail'; recipeId: string }
  | { type: 'edition'; recette: Recipe }
  | { type: 'cuisson'; recipeId: string }
  | { type: 'reglages' }

export const PILE_INITIALE: Vue[] = [{ type: 'onglet', onglet: 'propose' }]

/**
 * Une adresse par écran — mais dans le fragment (`#/panier`), pas dans
 * le chemin (`/panier`).
 *
 * L'app empilait ses écrans avec `pushState` sans jamais toucher à
 * l'URL : tout se passait sur « / ». Côté navigation ça marchait très
 * bien ; côté mesure, ça voulait dire que les quatre onglets, les
 * fiches recette et les réglages arrivaient dans Rybbit comme une seule
 * et même page. « Aucune page » n'était pas une page manquante, c'était
 * quatre pages écrasées en une.
 *
 * Le fragment plutôt que le chemin, parce que le `dist/` est servi en
 * statique (voir README) : un vrai `/panier` demande une règle de
 * réécriture côté hébergeur, et sans elle un rechargement ou un lien
 * partagé tombe sur un 404. Le fragment ne quitte jamais le navigateur,
 * donc n'importe quel hébergement statique le supporte tel quel — et
 * Rybbit lit justement le fragment comme un chemin quand il commence
 * par `#/`.
 */
export function chemin(vue: Vue): string {
  switch (vue.type) {
    case 'onglet':
      // L'accueil garde l'adresse nue : c'est la page de loin la plus
      // vue, et « / » se lit mieux que « /propose » dans un rapport.
      return vue.onglet === 'propose' ? '#/' : `#/${vue.onglet}`
    case 'detail':
      return `#/recette/${vue.recipeId}`
    case 'edition':
      return `#/recette/${vue.recette.id}/modifier`
    case 'cuisson':
      return `#/cuisson/${vue.recipeId}`
    case 'reglages':
      return '#/reglages'
  }
}

/** `''`, `'#'` et `'#/'` désignent tous l'accueil. */
export function normaliserChemin(hash: string): string {
  return hash === '' || hash === '#' ? '#/' : hash
}

const ONGLETS: Onglet[] = ['propose', 'panier', 'liste', 'cuisson']

/**
 * Le chemin inverse : reconstruire la pile d'écrans à partir de l'URL.
 *
 * Sert au démarrage à froid — un lien partagé, un favori, un onglet
 * rouvert — quand `sessionStorage` n'a rien à rendre. Les sous-écrans
 * repartent du catalogue plutôt que d'être seuls dans la pile : sans
 * ça, « précédent » sur une fiche ouverte par un lien sortirait du site
 * au lieu de montrer les recettes.
 *
 * `null` quand l'adresse ne veut rien dire, pour que l'appelant retombe
 * sur l'accueil plutôt que sur un écran blanc.
 */
export function pileDepuisChemin(hash: string): Vue[] | null {
  const chemin = normaliserChemin(hash)
  if (!chemin.startsWith('#/')) return null
  const segments = chemin.slice(2).split('/').filter(Boolean)

  if (segments.length === 0) return [...PILE_INITIALE]

  const [premier, second, troisieme] = segments

  if (premier === 'reglages' && segments.length === 1) {
    return [...PILE_INITIALE, { type: 'reglages' }]
  }

  if (premier === 'recette' && second) {
    // L'écran d'édition tient une recette entière, pas un identifiant :
    // impossible à reconstruire avant que le catalogue soit chargé. On
    // ouvre la fiche, d'où « Modifier » est à un doigt.
    if (segments.length === 2 || (segments.length === 3 && troisieme === 'modifier')) {
      return [...PILE_INITIALE, { type: 'detail', recipeId: second }]
    }
    return null
  }

  // « cuisson » est à la fois un onglet (les plats à cuisiner) et un
  // écran (un plat, étape par étape) : c'est l'identifiant qui tranche.
  if (premier === 'cuisson' && second && segments.length === 2) {
    return [{ type: 'onglet', onglet: 'cuisson' }, { type: 'cuisson', recipeId: second }]
  }

  if (segments.length === 1 && (ONGLETS as string[]).includes(premier!)) {
    return [{ type: 'onglet', onglet: premier as Onglet }]
  }

  return null
}

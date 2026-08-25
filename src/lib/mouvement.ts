/**
 * « Réduire les animations », côté JavaScript.
 *
 * La feuille de style couvre déjà tout ce qui s'anime en CSS (voir le
 * bloc `prefers-reduced-motion` de `styles.css`), mais deux mouvements
 * lui échappent par construction : les pseudo-éléments
 * `::view-transition-*`, qui n'appartiennent pas à l'arbre du document,
 * et les défilements lancés depuis le code avec `behavior: 'smooth'`.
 * Ceux-là se gardent ici.
 *
 * Le réglage se lit à l'appel plutôt qu'une fois pour toutes : sur
 * Android comme sur iOS il suit l'économiseur de batterie, et il peut
 * donc basculer pendant que l'app est ouverte.
 *
 * Le `try` est là pour les WebViews anciennes où `matchMedia` manque :
 * dans le doute on anime, c'est le comportement d'avant cette fonction.
 */
export function mouvementReduit(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

/**
 * Le comportement de défilement à passer à `scrollIntoView` /
 * `scrollTo` : glissé, sauf si l'utilisateur a demandé qu'on se tienne
 * tranquille — auquel cas on saute directement à destination. Arriver au
 * bon endroit n'est pas négociable ; la façon d'y arriver, si.
 */
export function comportementDefilement(): ScrollBehavior {
  return mouvementReduit() ? 'auto' : 'smooth'
}

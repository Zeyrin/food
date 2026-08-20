import { useEffect, useState } from 'react'

/** Rectangle de l'élément visé, avec le rayon de bordure qu'il affiche réellement. */
export interface TourRect {
  rect: DOMRect
  /** `border-top-left-radius` calculé de l'élément (ex. "16px", "50%", "999px"). */
  rayon: string
}

/**
 * Rectangle (coordonnées viewport) de l'élément marqué
 * `data-tour="cible"`, recalculé au défilement, au redimensionnement, et
 * si l'élément change de taille. `null` tant qu'il n'existe pas encore
 * (l'onglet qui le contient est en train de se monter) ou si `cible` est
 * `null` (étape sans repère).
 *
 * Le rayon de bordure est capturé en même temps que le rectangle pour que
 * l'anneau qui l'entoure (`.visite-repere`) puisse épouser les coins
 * réels du bouton visé plutôt qu'un rayon fixe arbitraire.
 *
 * Quelques essais espacés plutôt qu'un `MutationObserver` : le rendu
 * React qui suit un changement d'onglet prend un ou deux battements,
 * jamais plus.
 */
export function useTourRect(cible: string | null): TourRect | null {
  const [tour, setTour] = useState<TourRect | null>(null)

  useEffect(() => {
    if (!cible) {
      setTour(null)
      return
    }

    let el: Element | null = null
    let ro: ResizeObserver | null = null

    const mesurer = () => {
      if (!el) {
        el = document.querySelector(`[data-tour="${cible}"]`)
        if (el) {
          ro = new ResizeObserver(mesurer)
          ro.observe(el)
        }
      }
      if (el) {
        setTour({
          rect: el.getBoundingClientRect(),
          rayon: getComputedStyle(el).borderTopLeftRadius,
        })
      }
    }

    const essais = [0, 50, 150, 350, 600].map((delai) => window.setTimeout(mesurer, delai))
    window.addEventListener('resize', mesurer)
    window.addEventListener('scroll', mesurer, true)

    return () => {
      essais.forEach(clearTimeout)
      window.removeEventListener('resize', mesurer)
      window.removeEventListener('scroll', mesurer, true)
      ro?.disconnect()
    }
  }, [cible])

  return tour
}

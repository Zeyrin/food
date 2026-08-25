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
 *
 * La mesure ne se fait jamais directement dans l'écouteur. `scroll` part
 * bien plus souvent que le navigateur ne dessine, et chaque passage
 * appelait `getBoundingClientRect()` et `getComputedStyle()` — deux
 * lectures qui forcent le navigateur à recalculer la mise en page sur
 * place — puis un `setState` qui redessinait toute la visite. Défiler
 * pendant la visite guidée revenait donc à mesurer et re-rendre plusieurs
 * fois par image. Les événements ne font plus que réserver une frame, et
 * une mesure identique à la précédente ne déclenche aucun rendu.
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
    let frame = 0
    // Signature du dernier rectangle publié : défiler dans une page qui
    // ne bouge pas, ou un `ResizeObserver` qui se réveille pour rien,
    // n'ont alors aucun coût de rendu.
    let publiee = ''

    const mesurer = () => {
      frame = 0
      if (!el) {
        el = document.querySelector(`[data-tour="${cible}"]`)
        if (el) {
          ro = new ResizeObserver(planifier)
          ro.observe(el)
        }
      }
      if (!el) return
      const rect = el.getBoundingClientRect()
      const rayon = getComputedStyle(el).borderTopLeftRadius
      const signature = `${rect.top} ${rect.left} ${rect.width} ${rect.height} ${rayon}`
      if (signature === publiee) return
      publiee = signature
      setTour({ rect, rayon })
    }

    /** Au plus une mesure par image, quel que soit le nombre d'événements. */
    const planifier = () => {
      if (frame) return
      frame = requestAnimationFrame(mesurer)
    }

    const essais = [0, 50, 150, 350, 600].map((delai) => window.setTimeout(planifier, delai))
    window.addEventListener('resize', planifier)
    // `capture` pour attraper aussi les défilements d'un conteneur
    // interne, `passive` pour ne jamais retenir le geste de l'utilisateur.
    window.addEventListener('scroll', planifier, { capture: true, passive: true })

    return () => {
      essais.forEach(clearTimeout)
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('resize', planifier)
      window.removeEventListener('scroll', planifier, true)
      ro?.disconnect()
    }
  }, [cible])

  return tour
}

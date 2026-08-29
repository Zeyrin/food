import { useLayoutEffect } from 'react'

/**
 * Fige le défilement du document tant que le composant appelant est
 * monté. Écrit pour la visite guidée : elle se joue *par-dessus* l'app
 * réelle, et rien ne retenait le geste — la molette comme le doigt
 * passaient au travers du voile et faisaient défiler l'écran derrière,
 * pendant que le trou et sa carte, eux, restaient collés au repère
 * mesuré. On se retrouvait à commenter un bouton parti hors de vue.
 *
 * `overflow: hidden` sur le document suffirait sur desktop, mais iOS
 * Safari continue d'y faire défiler la page au doigt : la seule mise en
 * garde qui tienne partout est de sortir le corps du flux
 * (`position: fixed`), donc de ne plus rien laisser à faire défiler.
 * Sortir le corps du flux ramène le document en haut : on mémorise la
 * position, on la compense par un décalage négatif pendant le gel, et on
 * la rend au démontage — l'utilisateur retrouve son écran là où il
 * l'avait laissé.
 *
 * L'autre effet de bord du gel est la barre de défilement qui disparaît
 * (là où le système en dessine une) : la page s'élargirait de sa largeur
 * d'un coup, et tout le texte se reformaterait sous le voile. On réserve
 * donc cette largeur en marge intérieure le temps du gel.
 *
 * Comme `data-defile`, l'attribut est posé sur `<html>` et le style qui
 * va avec vit dans `styles.css` (`html[data-gele='true']`) : le
 * composant ne pose qu'un drapeau et deux mesures.
 */
export function useGelDefilement() {
  // En effet de mise en page plutôt qu'en effet différé : le gel doit
  // être appliqué dans la même frame que l'affichage du voile, sinon on
  // peut défiler entre les deux.
  useLayoutEffect(() => {
    const racine = document.documentElement
    const y = window.scrollY
    const barre = window.innerWidth - racine.clientWidth

    racine.style.setProperty('--gel-haut', `${-y}px`)
    racine.style.setProperty('--gel-barre', `${barre}px`)
    racine.dataset.gele = 'true'

    return () => {
      delete racine.dataset.gele
      racine.style.removeProperty('--gel-haut')
      racine.style.removeProperty('--gel-barre')
      window.scrollTo(0, y)
    }
  }, [])
}

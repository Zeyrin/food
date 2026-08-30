import { phraseRecette } from '../lib/identite'
import { phrasesSansPhoto, useLangue } from '../lib/i18n'

/**
 * Ce qu'on montre à la place d'une photo manquante : plutôt qu'une
 * simple initiale sur un aplat de couleur (qui donnait l'impression
 * d'une image encore en chargement), une formule qui assume l'absence
 * — toujours la même pour une recette donnée, voir `phraseRecette`.
 */
export default function VignettePlaceholder({ titre }: { titre: string }) {
  const { langue } = useLangue()
  return <p className="vignette-placeholder">{phraseRecette(titre, phrasesSansPhoto(langue))}</p>
}

import type { Recipe } from '../types'
import { phraseRecette } from '../lib/identite'
import { phrasesSansPhoto, useLangue } from '../lib/i18n'
import AssietteRecette from './AssietteRecette'

/**
 * Ce qu'on montre à la place d'une photo manquante : l'assiette dessinée
 * de la recette (voir `lib/assiette.ts`), posée sur une nappe à la teinte
 * du plat. La formule qui assume l'absence — toujours la même pour une
 * recette donnée, voir `phraseRecette` — l'accompagne là où elle a la
 * place de se lire (la fiche) ; sur une carte de grille, elle passait sous
 * le bouton d'ajout et disputait la vignette au dessin.
 */
export default function VignettePlaceholder({
  recette,
  avecPhrase = false,
}: {
  recette: Pick<Recipe, 'titre' | 'ingredients'>
  avecPhrase?: boolean
}) {
  const { langue } = useLangue()
  return (
    <>
      <AssietteRecette titre={recette.titre} ingredients={recette.ingredients} />
      {avecPhrase && (
        <p className="vignette-placeholder">{phraseRecette(recette.titre, phrasesSansPhoto(langue))}</p>
      )}
    </>
  )
}

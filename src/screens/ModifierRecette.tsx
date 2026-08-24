import type { Recipe } from '../types'
import { useLangue } from '../lib/i18n'
import Icone from '../components/Icone'
import FormulaireRecette from '../components/FormulaireRecette'

/**
 * Modifier une recette, c'est remplir les mêmes cases que pour
 * l'écrire : le même formulaire, prérempli. Avant, cet écran ouvrait
 * la recette sous forme de JSON — corriger « 250 g » en « 300 g »
 * demandait de retrouver la bonne accolade sur un téléphone.
 */
interface Props {
  recette: Recipe
  titresExistants: string[]
  tagsConnus: string[]
  onEnregistrer: (recette: Recipe) => Promise<void>
  onQuitter: () => void
}

export default function ModifierRecette({
  recette,
  titresExistants,
  tagsConnus,
  onEnregistrer,
  onQuitter,
}: Props) {
  const { t } = useLangue()

  return (
    <>
      <header className="entete-app">
        <div className="entete-app-titre">
          <Icone nom="crayon" />
          <h1>{t('ajouter.titreEdition')}</h1>
        </div>
      </header>

      <FormulaireRecette
        recetteInitiale={recette}
        titresExistants={titresExistants}
        tagsConnus={tagsConnus}
        actionsCollantes
        onValider={async (modifiee) => {
          await onEnregistrer(modifiee)
          onQuitter()
        }}
        onAnnuler={onQuitter}
      />
    </>
  )
}

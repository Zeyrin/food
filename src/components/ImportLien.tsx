import { useState } from 'react'
import type { Recipe } from '../types'
import { useLangue } from '../lib/i18n'
import { extraireUrl, importerDepuisUrl } from '../lib/importerRecette'
import Icone from './Icone'
import FormulaireRecette from './FormulaireRecette'

/**
 * Le chemin « j'ai trouvé la recette sur un site » : on colle l'adresse,
 * l'app lit la page, puis ouvre le formulaire prérempli. Rien n'entre au
 * catalogue sans relecture — les quantités sont déduites de phrases
 * libres (« 2 c. à soupe d'huile ») et l'analyse peut se tromper.
 */
interface Props {
  onAjouter: (recette: Recipe) => Promise<void>
  onRetour: () => void
  titresExistants: string[]
  tagsConnus: string[]
}

export default function ImportLien({ onAjouter, onRetour, titresExistants, tagsConnus }: Props) {
  const { t } = useLangue()
  const [saisie, setSaisie] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)
  const [brouillon, setBrouillon] = useState<Recipe | null>(null)

  const importer = async () => {
    const url = extraireUrl(saisie)
    if (!url) {
      setErreur(t('import.adresseInvalide'))
      return
    }
    setErreur(null)
    setEnCours(true)
    try {
      setBrouillon(await importerDepuisUrl(url))
    } catch (e) {
      setErreur(e instanceof Error ? e.message : t('import.erreurServeur'))
    } finally {
      setEnCours(false)
    }
  }

  if (brouillon) {
    return (
      <>
        <p className="aide" role="status">
          {t('import.aRelire')}
        </p>
        <FormulaireRecette
          brouillon={brouillon}
          titresExistants={titresExistants}
          tagsConnus={tagsConnus}
          onValider={onAjouter}
          onAnnuler={() => setBrouillon(null)}
          libelleAnnuler={t('import.autreLien')}
        />
      </>
    )
  }

  return (
    <div className="parcours-ia">
      <p className="aide-champ">{t('import.texte')}</p>
      <input
        className="champ-texte"
        type="url"
        inputMode="url"
        autoCapitalize="off"
        autoCorrect="off"
        placeholder="https://…"
        value={saisie}
        onChange={(e) => setSaisie(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && !enCours && saisie.trim() && importer()}
        aria-label={t('import.champ')}
      />
      {erreur && (
        <p className="aide espace-haut" role="alert">
          <Icone nom="alerte" taille={16} /> {erreur}
        </p>
      )}
      <div className="actions-formulaire">
        <button className="principal" onClick={importer} disabled={enCours || !saisie.trim()}>
          {enCours ? t('import.lecture') : t('import.bouton')}
        </button>
        <button className="discret suite pleine-largeur" onClick={onRetour} disabled={enCours}>
          {t('ajouter.retourAuChoix')}
        </button>
      </div>
    </div>
  )
}

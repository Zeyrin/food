import { useState } from 'react'
import { useLangue } from '../lib/i18n'
import Icone from './Icone'

/**
 * Ce qu'on voit en arrivant par un lien d'invitation (`#/f/<uuid>`).
 *
 * `bienvenue` : l'appareil n'avait pas de maison, il est entré dans celle
 * du lien. Jusqu'ici rien ne le disait : on tombait dans une app déjà
 * remplie, sans savoir que la liste était celle de quelqu'un d'autre.
 *
 * `confirmer` : l'appareil a déjà sa maison, et le lien en désigne une
 * autre. On demande avant d'y passer — la maison d'ici est notée comme
 * « maison d'avant » si l'on accepte (voir `rejoindreFoyer`).
 */
export type EtatInvitation = 'bienvenue' | 'confirmer'

interface Props {
  etat: EtatInvitation
  de: string | null
  onRejoindre: () => Promise<boolean>
  onFermer: () => void
}

export default function InvitationMaison({ etat, de, onRejoindre, onFermer }: Props) {
  const { t } = useLangue()
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const rejoindre = async () => {
    setEnCours(true)
    setErreur(null)
    try {
      if (!(await onRejoindre())) setErreur(t('reglages.lienIntrouvable'))
    } catch {
      setErreur(t('reglages.codeErreurReseau'))
    } finally {
      setEnCours(false)
    }
  }

  if (etat === 'bienvenue') {
    return (
      <aside className="bandeau-integre bandeau-invitation" role="status">
        <p>
          <b>{de ? t('invitation.bienvenueDe', { de }) : t('invitation.bienvenue')}</b>{' '}
          {t('invitation.bienvenueTexte')}
        </p>
        <div className="bandeau-integre-actions">
          <button className="discret accent" onClick={onFermer}>
            <Icone nom="coche" taille={18} /> {t('invitation.compris')}
          </button>
        </div>
      </aside>
    )
  }

  return (
    <aside className="bandeau-integre bandeau-invitation" role="alertdialog" aria-live="polite">
      <p>
        <b>{de ? t('invitation.confirmerDe', { de }) : t('invitation.confirmer')}</b>{' '}
        {t('invitation.confirmerTexte')}
      </p>
      {erreur && (
        <div className="bloc-erreurs" role="alert">
          <p>{erreur}</p>
        </div>
      )}
      <div className="bandeau-integre-actions">
        <button className="discret accent" onClick={() => void rejoindre()} disabled={enCours}>
          {t('invitation.rejoindre')}
        </button>
        <button className="lien-discret" onClick={onFermer} disabled={enCours}>
          {t('invitation.rester')}
        </button>
      </div>
    </aside>
  )
}

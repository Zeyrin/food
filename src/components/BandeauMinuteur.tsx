import type { Minuteur } from '../lib/minuteurs'
import { mmss } from '../lib/minuteurs'
import Icone from './Icone'

interface Props {
  /** Triés par heure de fin : on affiche le prochain à sonner. */
  liste: Minuteur[]
  maintenant: number
  sonne: boolean
  onOuvrir: () => void
  /** `global` : hors mode cuisson, sur le fond clair de l'app. */
  variante?: 'cuisson' | 'global'
}

/**
 * Bandeau plein largeur plutôt qu'un petit rond dans un coin : le
 * minuteur est l'info la plus importante pendant l'attente entre deux
 * étapes, il mérite de gros chiffres qu'on lit sans plisser les yeux
 * depuis l'autre bout de la cuisine.
 *
 * Le même composant sert dans le mode cuisson (dans le flux, sur fond
 * sombre) et partout ailleurs (fixé au-dessus de la barre d'onglets) :
 * un minuteur lancé ne disparaît plus de la vue parce qu'on a changé
 * d'écran.
 */
export default function BandeauMinuteur({ liste, maintenant, sonne, onOuvrir, variante = 'cuisson' }: Props) {
  const premier = liste[0]
  if (!premier) return null

  const restant = Math.max(0, Math.round((premier.fin - maintenant) / 1000))
  const total = premier.fin - premier.depart
  const progression =
    total <= 0 ? 100 : Math.min(100, Math.max(0, ((maintenant - premier.depart) / total) * 100))

  return (
    <button
      className={`bandeau-minuteur${variante === 'global' ? ' bandeau-minuteur-global' : ''}`}
      data-sonne={sonne}
      onClick={onOuvrir}
      aria-label={`${liste.length} minuteur${liste.length > 1 ? 's' : ''} en cours, ouvrir la gestion`}
    >
      <div className="bandeau-minuteur-ligne">
        <span className="bandeau-minuteur-nom">
          <Icone nom="minuteur" taille={20} />
          {premier.nom}
          {liste.length > 1 && <i className="pastille-nombre">{liste.length}</i>}
        </span>
        <b className="bandeau-minuteur-valeur">{sonne ? 'Terminé' : mmss(restant)}</b>
      </div>
      <div className="bandeau-minuteur-jauge" aria-hidden="true">
        <i style={{ width: `${progression}%` }} />
      </div>
    </button>
  )
}

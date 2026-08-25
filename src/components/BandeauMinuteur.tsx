import type { CSSProperties } from 'react'
import type { Minuteur } from '../lib/minuteurs'
import { mmss } from '../lib/minuteurs'
import { useLangue } from '../lib/i18n'
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
  const { t } = useLangue()
  const premier = liste[0]
  if (!premier) return null

  const restant = Math.max(0, Math.round((premier.fin - maintenant) / 1000))
  const total = premier.fin - premier.depart
  // Fraction de 0 à 1 plutôt qu'un pourcentage : c'est le facteur d'un
  // `scaleX` côté CSS, qui remplace l'animation de largeur d'avant.
  const progression =
    total <= 0 ? 1 : Math.min(1, Math.max(0, (maintenant - premier.depart) / total))

  return (
    <button
      className={`bandeau-minuteur${variante === 'global' ? ' bandeau-minuteur-global' : ''}`}
      data-sonne={sonne}
      onClick={onOuvrir}
      aria-label={t('bandeauMinuteur.label', { n: liste.length, s: liste.length > 1 ? 's' : '' })}
    >
      <div className="bandeau-minuteur-ligne">
        <span className="bandeau-minuteur-nom">
          <Icone nom="minuteur" taille={20} />
          {/* Le nom vit dans son propre span pour pouvoir se tronquer sur
              une ligne : c'est le décompte, à droite, qui garde sa place. */}
          <span className="bandeau-minuteur-libelle">{premier.nom}</span>
          {liste.length > 1 && <i className="pastille-nombre">{liste.length}</i>}
        </span>
        <b className="bandeau-minuteur-valeur">{sonne ? t('bandeauMinuteur.termine') : mmss(restant)}</b>
      </div>
      <div className="bandeau-minuteur-jauge" aria-hidden="true">
        <i style={{ '--progression': progression } as CSSProperties} />
      </div>
    </button>
  )
}

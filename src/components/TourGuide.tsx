import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import type { Onglet } from '../types'
import { VISITE_GUIDEE } from '../data/onboarding'
import { useTourRect } from '../hooks/useTourRect'
import Icone from './Icone'

interface Props {
  ongletActuel: Onglet
  onOnglet: (onglet: Onglet) => void
  onTerminer: () => void
}

/** Marge entre le repère et les bandes qui l'entourent, et entre le repère et la carte. */
const MARGE = 10

/**
 * Visite guidée jouée par-dessus l'app réelle plutôt qu'un diaporama à
 * part : quatre bandes sombres laissent un trou exactement sur le
 * bouton visé (`data-tour` sur l'élément réel), avec un anneau qui
 * pulse autour. La carte de texte glisse d'un repère à l'autre — les
 * étapes viennent de data/onboarding.ts, ce composant ne fait
 * qu'afficher et positionner.
 */
export default function TourGuide({ ongletActuel, onOnglet, onTerminer }: Props) {
  const [index, setIndex] = useState(0)
  const etape = VISITE_GUIDEE[index]!
  const dernier = index === VISITE_GUIDEE.length - 1

  // Ne réagit qu'aux changements d'étape : si l'utilisateur navigue de
  // son côté pendant la visite, on ne veut pas annuler son geste à
  // chaque re-rendu.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (etape.onglet && etape.onglet !== ongletActuel) onOnglet(etape.onglet)
  }, [index])

  const rect = useTourRect(etape.cible)

  const carteRef = useRef<HTMLDivElement>(null)
  const [style, setStyle] = useState<CSSProperties>({})
  const centre = !rect

  useLayoutEffect(() => {
    if (!rect) {
      setStyle({})
      return
    }
    const carte = carteRef.current
    const hauteurCarte = carte?.offsetHeight ?? 220
    const largeurCarte = carte?.offsetWidth ?? 320
    const placeEnBas = rect.bottom + MARGE + hauteurCarte < window.innerHeight
    const haut = placeEnBas
      ? rect.bottom + MARGE
      : Math.max(MARGE, rect.top - MARGE - hauteurCarte)
    const gauche = Math.min(
      Math.max(MARGE, rect.left + rect.width / 2 - largeurCarte / 2),
      window.innerWidth - largeurCarte - MARGE,
    )
    setStyle({ top: haut, left: gauche })
  }, [rect, index])

  const suivant = () => (dernier ? onTerminer() : setIndex((i) => i + 1))
  const precedent = () => setIndex((i) => Math.max(0, i - 1))

  useEffect(() => {
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onTerminer()
      if (e.key === 'ArrowRight' || e.key === 'Enter') suivant()
      if (e.key === 'ArrowLeft') precedent()
    }
    window.addEventListener('keydown', surTouche)
    return () => window.removeEventListener('keydown', surTouche)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  const vw = window.innerWidth
  const vh = window.innerHeight
  const bandes = rect
    ? [
        { top: 0, left: 0, width: vw, height: Math.max(0, rect.top - MARGE) },
        { top: rect.bottom + MARGE, left: 0, width: vw, height: Math.max(0, vh - rect.bottom - MARGE) },
        {
          top: Math.max(0, rect.top - MARGE),
          left: 0,
          width: Math.max(0, rect.left - MARGE),
          height: rect.height + MARGE * 2,
        },
        {
          top: Math.max(0, rect.top - MARGE),
          left: rect.right + MARGE,
          width: Math.max(0, vw - rect.right - MARGE),
          height: rect.height + MARGE * 2,
        },
      ]
    : [{ top: 0, left: 0, width: vw, height: vh }]

  return (
    <div className="visite" role="dialog" aria-modal="true" aria-label="Visite guidée de FFFood">
      {bandes.map((b, i) => (
        <div key={i} className="visite-bande" style={b} />
      ))}

      {rect && (
        <div
          className="visite-repere"
          style={{
            top: rect.top - MARGE,
            left: rect.left - MARGE,
            width: rect.width + MARGE * 2,
            height: rect.height + MARGE * 2,
          }}
        />
      )}

      <div ref={carteRef} className={`visite-carte${centre ? ' visite-carte-centre' : ''}`} style={style}>
        <div className="visite-carte-entete">
          <span className="visite-compteur">
            {index + 1} / {VISITE_GUIDEE.length}
          </span>
          <button className="discret visite-passer" onClick={onTerminer}>
            Passer
          </button>
        </div>

        <div className="visite-carte-corps" key={index}>
          <h2>{etape.titre}</h2>
          <p className="aide">{etape.texte}</p>
        </div>

        <div className="visite-points" role="tablist" aria-label="Étapes de la visite">
          {VISITE_GUIDEE.map((e, i) => (
            <button
              key={e.titre}
              className="visite-point"
              role="tab"
              aria-current={i === index}
              aria-selected={i === index}
              aria-label={`Étape ${i + 1} sur ${VISITE_GUIDEE.length} : ${e.titre}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>

        <div className="visite-actions">
          {index > 0 && (
            <button className="discret" onClick={precedent}>
              <Icone nom="precedent" taille={18} /> Retour
            </button>
          )}
          <button className="principal" onClick={suivant}>
            {dernier ? 'Commencer' : 'Suivant'} <Icone nom="suivant" taille={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

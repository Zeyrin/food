import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import type { Onglet } from '../types'
import { VISITE_GUIDEE } from '../data/onboarding'
import { useGelDefilement } from '../hooks/useGelDefilement'
import { useTourRect } from '../hooks/useTourRect'
import { etapesOnboarding, useLangue } from '../lib/i18n'
import { mesurer } from '../lib/mesure'
import Icone from './Icone'

interface Props {
  ongletActuel: Onglet
  onOnglet: (onglet: Onglet) => void
  onTerminer: () => void
}

/** Marge entre le repère et les bandes qui l'entourent, et entre le repère et la carte. */
const MARGE = 10

/**
 * Rayon de bordure du repère à partir de celui, réel, de l'élément visé.
 * Le repère est plus grand que l'élément de `MARGE` de chaque côté : pour
 * que ses coins restent concentriques à ceux du bouton (au lieu d'un
 * rayon fixe qui ne correspond à rien), on ajoute cette même marge au
 * rayon en pixels. Les rayons en pourcentage (cercle) ou en unités
 * relatives (pilule à `999px`) restent tels quels, la forme se conserve
 * déjà à l'agrandissement.
 */
function rayonRepere(rayon: string | undefined): string {
  if (!rayon) return `${MARGE}px`
  const valeur = parseFloat(rayon)
  if (Number.isNaN(valeur) || !rayon.endsWith('px')) return rayon
  return `${valeur + MARGE}px`
}

/**
 * Visite guidée jouée par-dessus l'app réelle plutôt qu'un diaporama à
 * part : quatre bandes sombres laissent un trou exactement sur le
 * bouton visé (`data-tour` sur l'élément réel), avec un anneau qui
 * pulse autour. La carte de texte glisse d'un repère à l'autre — les
 * étapes viennent de data/onboarding.ts, ce composant ne fait
 * qu'afficher et positionner.
 */
export default function TourGuide({ ongletActuel, onOnglet, onTerminer }: Props) {
  const { langue, t } = useLangue()
  const [index, setIndex] = useState(0)
  const textes = etapesOnboarding(langue)
  const etape = { ...VISITE_GUIDEE[index]!, ...textes[index]! }
  const dernier = index === VISITE_GUIDEE.length - 1

  // Ne réagit qu'aux changements d'étape : si l'utilisateur navigue de
  // son côté pendant la visite, on ne veut pas annuler son geste à
  // chaque re-rendu.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (etape.onglet && etape.onglet !== ongletActuel) onOnglet(etape.onglet)
  }, [index])

  const tour = useTourRect(etape.cible)
  const rect = tour?.rect ?? null
  // L'app derrière le voile ne défile plus : le repère et la carte sont
  // posés sur des coordonnées d'écran mesurées une fois, un défilement
  // les laissait désigner du vide.
  useGelDefilement()
  const rayon = rayonRepere(tour?.rayon)

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
    setStyle({ '--x': `${gauche}px`, '--y': `${haut}px` } as CSSProperties)
  }, [rect, index])

  const suivant = () => {
    if (!dernier) return setIndex((i) => i + 1)
    mesurer('visite_terminee', { etapes: VISITE_GUIDEE.length })
    onTerminer()
  }

  // Abandonner n'est pas terminer : l'étape où l'on décroche dit laquelle
  // ne vaut pas le détour.
  const abandonner = () => {
    mesurer('visite_passee', { etape: index + 1, etapes: VISITE_GUIDEE.length })
    onTerminer()
  }
  const precedent = () => setIndex((i) => Math.max(0, i - 1))

  useEffect(() => {
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') abandonner()
      if (e.key === 'ArrowRight' || e.key === 'Enter') suivant()
      if (e.key === 'ArrowLeft') precedent()
    }
    window.addEventListener('keydown', surTouche)
    return () => window.removeEventListener('keydown', surTouche)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  const vw = window.innerWidth
  const vh = window.innerHeight

  /**
   * Le trou laissé dans le voile : la cible, élargie de `MARGE` de chaque
   * côté, arrondie au pixel entier. Bandes, coins et anneau se partagent
   * ces quatre bords — un bord à la moitié d'un pixel fait border deux
   * voiles translucides sur un demi-pixel d'antialiasing, et la jointure
   * se lit comme un liseré clair en travers de l'écran.
   */
  const trou = rect
    ? {
        gauche: Math.round(rect.left - MARGE),
        haut: Math.round(rect.top - MARGE),
        droite: Math.round(rect.right + MARGE),
        bas: Math.round(rect.bottom + MARGE),
      }
    : null

  /**
   * Les quatre bandes sombres autour du trou, décrites en coordonnées
   * d'écran. Elles ne sont pas posées avec `top`/`left`/`width`/`height`
   * mais converties en variables CSS que la feuille de style traduit en
   * une seule `transform` (voir `.visite-bande`) : le déplacement d'une
   * étape à l'autre se joue alors sur le compositeur, sans recalcul de
   * mise en page.
   */
  const bandes = trou
    ? (() => {
        // Une cible qui dépasse en haut de l'écran ne doit pas donner une
        // bande de hauteur négative aux flancs.
        const haut = Math.max(0, trou.haut)
        return [
          { x: 0, y: 0, l: vw, h: haut },
          { x: 0, y: trou.bas, l: vw, h: Math.max(0, vh - trou.bas) },
          { x: 0, y: haut, l: Math.max(0, trou.gauche), h: Math.max(0, trou.bas - haut) },
          {
            x: trou.droite,
            y: haut,
            l: Math.max(0, vw - trou.droite),
            h: Math.max(0, trou.bas - haut),
          },
        ]
      })()
    : [{ x: 0, y: 0, l: vw, h: vh }]

  return (
    <div className="visite" role="dialog" aria-modal="true" aria-label={t('tour.dialogueLabel')}>
      {bandes.map((b, i) => (
        <div
          key={i}
          className="visite-bande"
          style={
            {
              '--x': `${b.x}px`,
              '--y': `${b.y}px`,
              '--l': b.l,
              '--h': b.h,
            } as CSSProperties
          }
        />
      ))}

      {trou && (
        <div
          className="visite-coins"
          style={
            {
              '--x': `${trou.gauche}px`,
              '--y': `${trou.haut}px`,
              '--rayon-trou': rayon,
              width: trou.droite - trou.gauche,
              height: trou.bas - trou.haut,
            } as CSSProperties
          }
        />
      )}

      {trou && (
        <div
          className="visite-repere"
          style={
            {
              '--x': `${trou.gauche}px`,
              '--y': `${trou.haut}px`,
              width: trou.droite - trou.gauche,
              height: trou.bas - trou.haut,
              borderRadius: rayon,
            } as CSSProperties
          }
        />
      )}

      <div ref={carteRef} className={`visite-carte${centre ? ' visite-carte-centre' : ''}`} style={style}>
        <div className="visite-carte-entete">
          <span className="visite-compteur">
            {index + 1} / {VISITE_GUIDEE.length}
          </span>
          <button className="discret visite-passer" onClick={abandonner}>
            {t('tour.passer')}
          </button>
        </div>

        <div className="visite-carte-corps" key={index}>
          <h2>{etape.titre}</h2>
          <p className="aide">{etape.texte}</p>
        </div>

        <div className="visite-points" role="tablist" aria-label={t('tour.etapesLabel')}>
          {textes.map((e, i) => (
            <button
              key={e.titre}
              className="visite-point"
              role="tab"
              aria-current={i === index}
              aria-selected={i === index}
              aria-label={t('tour.etapeLabel', { n: i + 1, total: VISITE_GUIDEE.length, titre: e.titre })}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>

        <div className="visite-actions">
          {index > 0 && (
            <button className="discret" onClick={precedent}>
              <Icone nom="precedent" taille={18} /> {t('tour.retour')}
            </button>
          )}
          <button className="principal" onClick={suivant}>
            {dernier ? t('tour.commencer') : t('tour.suivant')} <Icone nom="suivant" taille={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

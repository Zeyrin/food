import { useEffect, useState } from 'react'
import type { Recipe } from '../types'
import corpus from '../data/recipes.json'
import { etapeEnTexte, formatQuantite, redimensionnerRecette } from '../lib/aggregate'
import { teinteRecette } from '../lib/identite'
import { useLangue } from '../lib/i18n'
import { mesurer } from '../lib/mesure'
import { NATIF, partagerTexte } from '../lib/natif'
import { ORIGINE_PUBLIQUE } from '../lib/plateforme'
import Icone from '../components/Icone'
import ImageRecette from '../components/ImageRecette'
import VignettePlaceholder from '../components/VignettePlaceholder'

interface Props {
  recette: Recipe
  /** Parts retenues au panier, ou celles du catalogue si le plat n'y est pas. */
  portions: number
  dansPanier: boolean
  /** Aimée après cuisson, ou écrite par le foyer (voir lib/favoris.ts). */
  favori: boolean
  /** Ajoute (avec le nombre de parts choisi ici) ou retire du panier. */
  onBasculerPanier: (portions: number) => void
  /** Change les parts d'un plat déjà au panier. */
  onPortions: (portions: number) => void
  onCuisiner: () => void
  onModifier: () => void
  /** Rejette si l'écriture échoue — l'écran le dit plutôt que de ne rien faire. */
  onSupprimer: () => Promise<void>
  onFermer: () => void
}

/**
 * Les plats du catalogue ont une page publique (scripts/prerender.mjs) ;
 * une recette collée par le foyer n'existe que chez lui, elle n'a rien
 * à partager.
 */
const PAGES_PUBLIQUES = new Set(corpus.map((r) => r.id))

const hoteDe = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export default function DetailRecette({
  recette,
  portions,
  dansPanier,
  favori,
  onBasculerPanier,
  onPortions,
  onCuisiner,
  onModifier,
  onSupprimer,
  onFermer,
}: Props) {
  const { t } = useLangue()
  /**
   * Confirmation dans la page plutôt qu'un `window.confirm` : la boîte
   * native s'affiche hors du thème de l'app, et son bouton « OK » est
   * exactement là où le doigt vient de cliquer — un double-appui
   * suffisait à supprimer une recette sans l'avoir lue.
   */
  const [confirmation, setConfirmation] = useState(false)

  /**
   * Supprimer passe par le réseau. Sans état d'échec, un appui sur
   * « Supprimer » hors ligne ne produisait rien du tout : la
   * confirmation restait ouverte, la recette en place, et aucun mot
   * pour expliquer pourquoi. On distingue donc l'attente de l'échec.
   */
  const [suppression, setSuppression] = useState(false)
  const [erreurSuppression, setErreurSuppression] = useState<string | null>(null)

  const supprimer = async () => {
    setSuppression(true)
    setErreurSuppression(null)
    try {
      await onSupprimer()
    } catch {
      setErreurSuppression(t('detail.suppressionEchouee'))
      setSuppression(false)
    }
  }

  /**
   * La fiche montrait toujours les quantités du catalogue, même quand le
   * panier retenait six parts : la liste de courses et le mode cuisson
   * annonçaient alors des doses que la fiche contredisait.
   *
   * Le nombre se règle ici, là où on lit la recette et où la question se
   * pose (« on est quatre ce soir ») — plutôt qu'après coup, dans le
   * panier. Tant que le plat n'y est pas, le réglage reste local et sert
   * de valeur d'entrée ; une fois dedans, il écrit dans le panier.
   */
  const [choix, setChoix] = useState(portions)
  useEffect(() => setChoix(portions), [portions])

  const changerParts = (n: number) => {
    const parts = Math.max(1, n)
    setChoix(parts)
    if (dansPanier) onPortions(parts)
  }

  const doses = redimensionnerRecette(recette, choix).ingredients

  /**
   * Le lien partagé vise la page publique du plat, pas l'app : elle se lit
   * sans maison ni JavaScript, s'affiche en aperçu dans une conversation,
   * et c'est elle qu'on veut voir citée ailleurs. Toujours l'adresse du
   * site, même depuis l'app des stores.
   */
  const [lienCopie, setLienCopie] = useState(false)
  const partager = async () => {
    const url = `${ORIGINE_PUBLIQUE}/recette/${recette.id}/`
    mesurer('recette_partagee', { partageNatif: NATIF || 'share' in navigator ? 1 : 0 })
    try {
      if (NATIF) {
        await partagerTexte(recette.titre, url)
        return
      }
      if (navigator.share) {
        await navigator.share({ title: recette.titre, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setLienCopie(true)
      setTimeout(() => setLienCopie(false), 2000)
    } catch {
      /* feuille de partage fermée sans choisir : rien à dire */
    }
  }

  return (
    <>
      <header className="entete-app">
        <div className="entete-app-titre">
          <button className="bouton-rond-discret" onClick={onFermer} aria-label={t('detail.retour')}>
            <Icone nom="precedent" taille={20} />
          </button>
          <h1>{recette.titre}</h1>
        </div>
      </header>

      <div
        className="detail-vignette vignette"
        data-sans-photo={recette.image ? undefined : 'true'}
        aria-hidden="true"
        style={{ '--teinte': teinteRecette(recette.titre) } as React.CSSProperties}
      >
        {!recette.image && <VignettePlaceholder recette={recette} avecPhrase />}
        <ImageRecette src={recette.image} />
        <span className="badge-temps">
          <Icone nom="minuteur" taille={14} /> {t('detail.minutes', { n: recette.temps })}
        </span>
      </div>

      {recette.description && <p className="aide detail-description">{recette.description}</p>}

      <div className="reglage-parts">
        <div className="compteur">
          <button onClick={() => changerParts(choix - 1)} aria-label={t('detail.moinsDeParts')}>
            <Icone nom="moins" taille={16} />
          </button>
          <span aria-live="polite">{choix}</span>
          <button onClick={() => changerParts(choix + 1)} aria-label={t('detail.plusDeParts')}>
            <Icone nom="plus" taille={16} />
          </button>
          <span className="compteur-label">{t('detail.part', { s: choix > 1 ? 's' : '' })}</span>
        </div>
        {choix !== recette.portions && (
          <button className="lien-discret" onClick={() => changerParts(recette.portions)}>
            {t('detail.revenirA', { n: recette.portions })}
          </button>
        )}
      </div>

      <div className="puces-info">
        {favori && (
          <span className="puce-info puce-favori">
            <Icone nom="coeur" taille={13} /> {t('detail.favori')}
          </span>
        )}
        {recette.tags.map((t) => (
          <span className="puce-info" key={t}>
            {t}
          </span>
        ))}
      </div>

      {recette.source && (
        <a className="lien-source" href={recette.source} target="_blank" rel="noopener noreferrer">
          <Icone nom="lien" taille={14} /> {t('detail.source', { site: hoteDe(recette.source) })}
        </a>
      )}

      <h2>{t('detail.ingredients')}</h2>
      {doses.map((ing) => (
        <div className="rangee rangee-lecture" key={ing.nom}>
          <span className="nom">{ing.nom}</span>
          <span className="qte">{formatQuantite(ing)}</span>
        </div>
      ))}

      <h2>{t('detail.etapes')}</h2>
      <ol className="apercu-etapes">
        {recette.etapes.map((etape, i) => (
          <li key={i}>{etapeEnTexte(etape)}</li>
        ))}
      </ol>

      <div className="barre-actions">
        <button className="principal" onClick={() => onBasculerPanier(choix)}>
          <Icone nom={dansPanier ? 'coche' : 'plus'} taille={20} />
          {dansPanier ? t('detail.retirerDuPanier') : t('detail.ajouterAuPanier')}
        </button>
        <div className="rangee-boutons">
          <button className="discret" onClick={onCuisiner}>
            <Icone nom="marmite" taille={18} /> {t('detail.cuisiner')}
          </button>
          <button className="discret" onClick={onModifier}>
            {t('detail.modifier')}
          </button>
        </div>
        {PAGES_PUBLIQUES.has(recette.id) && (
          <button className="discret pleine-largeur" onClick={partager}>
            <Icone nom="lien" taille={18} /> {lienCopie ? t('detail.lienCopie') : t('detail.partager')}
          </button>
        )}
        {confirmation ? (
          <div className="bloc-confirmation" role="alertdialog" aria-label={t('detail.supprimerDuCatalogue')}>
            <p>{t('detail.supprimerConfirmation', { titre: recette.titre })}</p>
            <div className="rangee-boutons">
              <button
                className="discret"
                onClick={() => setConfirmation(false)}
                disabled={suppression}
              >
                {t('detail.annuler')}
              </button>
              <button className="discret danger" onClick={supprimer} disabled={suppression}>
                {suppression ? t('detail.suppressionEnCours') : t('detail.supprimer')}
              </button>
            </div>
            {erreurSuppression && (
              <div className="bloc-erreurs" role="alert">
                <p>{erreurSuppression}</p>
              </div>
            )}
          </div>
        ) : (
          <button className="discret pleine-largeur danger" onClick={() => setConfirmation(true)}>
            {t('detail.supprimerDuCatalogue')}
          </button>
        )}
      </div>
    </>
  )
}

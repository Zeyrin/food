import { useEffect, useState } from 'react'
import type { Recipe } from '../types'
import { formatQuantite, redimensionnerRecette } from '../lib/aggregate'
import { teinteRecette } from '../lib/identite'
import { useLangue } from '../lib/i18n'
import Icone from '../components/Icone'
import ImageRecette from '../components/ImageRecette'

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
  onSupprimer: () => void
  onFermer: () => void
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
        aria-hidden="true"
        style={{ '--teinte': teinteRecette(recette.titre) } as React.CSSProperties}
      >
        {recette.titre.charAt(0)}
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
          <li key={i}>{etape}</li>
        ))}
      </ol>

      <div className="barre-actions">
        <button className="principal" onClick={() => onBasculerPanier(choix)}>
          <Icone nom={dansPanier ? 'coche' : 'plus'} taille={20} />
          {dansPanier ? t('detail.retirerDuPanier') : t('detail.ajouterAuPanier')}
        </button>
        <div className="rangee-boutons">
          <button className="discret" onClick={onCuisiner}>
            <Icone nom="grill" taille={18} /> {t('detail.cuisiner')}
          </button>
          <button className="discret" onClick={onModifier}>
            {t('detail.modifier')}
          </button>
        </div>
        {confirmation ? (
          <div className="bloc-confirmation" role="alertdialog" aria-label={t('detail.supprimerDuCatalogue')}>
            <p>{t('detail.supprimerConfirmation', { titre: recette.titre })}</p>
            <div className="rangee-boutons">
              <button className="discret" onClick={() => setConfirmation(false)}>
                {t('detail.annuler')}
              </button>
              <button className="discret danger" onClick={onSupprimer}>
                {t('detail.supprimer')}
              </button>
            </div>
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

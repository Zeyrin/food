import { useState } from 'react'
import type { Recipe } from '../types'
import { formatQuantite, redimensionnerRecette } from '../lib/aggregate'
import { teinteRecette } from '../lib/identite'
import Icone from '../components/Icone'
import ImageRecette from '../components/ImageRecette'

interface Props {
  recette: Recipe
  /** Parts retenues au panier, ou celles du catalogue si le plat n'y est pas. */
  portions: number
  dansPanier: boolean
  onBasculerPanier: () => void
  onCuisiner: () => void
  onModifier: () => void
  onSupprimer: () => void
  onFermer: () => void
}

export default function DetailRecette({
  recette,
  portions,
  dansPanier,
  onBasculerPanier,
  onCuisiner,
  onModifier,
  onSupprimer,
  onFermer,
}: Props) {
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
   */
  const doses = redimensionnerRecette(recette, portions).ingredients

  return (
    <>
      <header className="entete-app">
        <div className="entete-app-titre">
          <button className="bouton-rond-discret" onClick={onFermer} aria-label="Retour">
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
          <Icone nom="minuteur" taille={14} /> {recette.temps} min
        </span>
      </div>

      {recette.description && <p className="aide detail-description">{recette.description}</p>}

      <div className="puces-info">
        <span className="puce-info" data-ajuste={portions !== recette.portions ? 'true' : undefined}>
          {portions} part{portions > 1 ? 's' : ''}
        </span>
        {recette.tags.map((t) => (
          <span className="puce-info" key={t}>
            {t}
          </span>
        ))}
      </div>

      <h2>Ingrédients</h2>
      {doses.map((ing) => (
        <div className="rangee rangee-lecture" key={ing.nom}>
          <span className="nom">{ing.nom}</span>
          <span className="qte">{formatQuantite(ing)}</span>
        </div>
      ))}

      <h2>Étapes</h2>
      <ol className="apercu-etapes">
        {recette.etapes.map((etape, i) => (
          <li key={i}>{etape}</li>
        ))}
      </ol>

      <div className="barre-actions">
        <button className="principal" onClick={onBasculerPanier}>
          <Icone nom={dansPanier ? 'coche' : 'plus'} taille={20} />
          {dansPanier ? 'Retirer du panier' : 'Ajouter au panier'}
        </button>
        <div className="rangee-boutons">
          <button className="discret" onClick={onCuisiner}>
            <Icone nom="grill" taille={18} /> Cuisiner
          </button>
          <button className="discret" onClick={onModifier}>
            Modifier
          </button>
        </div>
        {confirmation ? (
          <div className="bloc-confirmation" role="alertdialog" aria-label="Confirmer la suppression">
            <p>Supprimer « {recette.titre} » du catalogue ? Les autres appareils du foyer la perdront aussi.</p>
            <div className="rangee-boutons">
              <button className="discret" onClick={() => setConfirmation(false)}>
                Annuler
              </button>
              <button className="discret danger" onClick={onSupprimer}>
                Supprimer
              </button>
            </div>
          </div>
        ) : (
          <button className="discret pleine-largeur danger" onClick={() => setConfirmation(true)}>
            Supprimer du catalogue
          </button>
        )}
      </div>
    </>
  )
}

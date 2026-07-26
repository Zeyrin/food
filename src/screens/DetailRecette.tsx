import type { Recipe } from '../types'
import { formatQuantite } from '../lib/aggregate'
import { teinteRecette } from '../lib/identite'
import Icone from '../components/Icone'

interface Props {
  recette: Recipe
  dansPanier: boolean
  onBasculerPanier: () => void
  onCuisiner: () => void
  onModifier: () => void
  onSupprimer: () => void
  onFermer: () => void
}

export default function DetailRecette({
  recette,
  dansPanier,
  onBasculerPanier,
  onCuisiner,
  onModifier,
  onSupprimer,
  onFermer,
}: Props) {
  const supprimer = () => {
    if (window.confirm(`Supprimer « ${recette.titre} » du catalogue ?`)) onSupprimer()
  }

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
        {recette.image ? <img src={recette.image} alt="" /> : recette.titre.charAt(0)}
        <span className="badge-temps">
          <Icone nom="minuteur" taille={14} /> {recette.temps} min
        </span>
      </div>

      {recette.description && <p className="aide detail-description">{recette.description}</p>}

      <div className="puces-info">
        <span className="puce-info">{recette.portions} parts</span>
        {recette.tags.map((t) => (
          <span className="puce-info" key={t}>
            {t}
          </span>
        ))}
      </div>

      <h2>Ingrédients</h2>
      {recette.ingredients.map((ing) => (
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
        <button className="discret pleine-largeur danger" onClick={supprimer}>
          Supprimer du catalogue
        </button>
      </div>
    </>
  )
}

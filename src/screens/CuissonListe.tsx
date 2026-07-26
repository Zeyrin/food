import type { BasketEntry, Recipe } from '../types'
import { teinteRecette } from '../lib/identite'
import Icone from '../components/Icone'

interface Props {
  recipes: Recipe[]
  basket: BasketEntry[]
  onCuisiner: (recipeId: string) => void
}

export default function CuissonListe({ recipes, basket, onCuisiner }: Props) {
  const byId = new Map(recipes.map((r) => [r.id, r]))

  const entete = (
    <header className="entete-app">
      <div className="entete-app-titre">
        <Icone nom="grill" />
        <h1>Cuisson</h1>
      </div>
    </header>
  )

  if (basket.length === 0) {
    return (
      <>
        {entete}
        <p className="vide">Ajoutez des recettes au panier pour pouvoir les cuisiner.</p>
      </>
    )
  }

  return (
    <>
      {entete}
      <p className="aide">Choisissez le plat à cuisiner maintenant.</p>

      {/* Même carte-vignette que Proposer plutôt que la petite ligne
          d'avant : choisir quoi cuisiner mérite d'être aussi appétissant
          que choisir quoi ajouter — et ça évite un bouton imbriqué dans
          un bouton (la carte entière est déjà l'unique cible tactile). */}
      <div className="grille-recettes">
        {basket.map((entree, i) => {
          const r = byId.get(entree.recipeId)
          if (!r) return null
          return (
            <button
              className="carte carte-recette"
              key={entree.recipeId}
              onClick={() => onCuisiner(r.id)}
              style={
                {
                  '--teinte': teinteRecette(r.titre),
                  '--rang': Math.min(i, 20),
                } as React.CSSProperties
              }
            >
              <div className="vignette" aria-hidden="true">
                {r.image && <img src={r.image} alt="" />}
                <span className="badge-temps">
                  <Icone nom="minuteur" taille={12} /> {r.temps} min
                </span>
                {!r.image && r.titre.charAt(0)}
              </div>
              <div className="carte-recette-corps">
                <h3>{r.titre}</h3>
                <div className="carte-cuisson-pied">
                  <span className="meta">{entree.portions} parts</span>
                  <Icone nom="suivant" taille={16} />
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </>
  )
}

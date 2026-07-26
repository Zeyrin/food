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

      <div className="grille-panier">
        {basket.map((entree) => {
          const r = byId.get(entree.recipeId)
          if (!r) return null
          return (
            <button
              className="carte carte-panier carte-panier-bouton"
              key={entree.recipeId}
              onClick={() => onCuisiner(r.id)}
            >
              <div
                className="vignette-mini"
                aria-hidden="true"
                style={{ '--teinte': teinteRecette(r.titre) } as React.CSSProperties}
              >
                {r.image ? <img src={r.image} alt="" /> : r.titre.charAt(0)}
              </div>
              <div className="carte-panier-corps">
                <h3>{r.titre}</h3>
                <div className="meta">
                  {r.temps} min · {entree.portions} parts
                </div>
              </div>
              <Icone nom="suivant" taille={20} />
            </button>
          )
        })}
      </div>
    </>
  )
}

import type { BasketEntry, Recipe } from '../types'

interface Props {
  recipes: Recipe[]
  basket: BasketEntry[]
  onBasket: (basket: BasketEntry[]) => void
  onCuisiner: (recipeId: string) => void
  onVersListe: () => void
}

export default function Panier({ recipes, basket, onBasket, onCuisiner, onVersListe }: Props) {
  const byId = new Map(recipes.map((r) => [r.id, r]))

  const setPortions = (recipeId: string, portions: number) =>
    onBasket(basket.map((e) => (e.recipeId === recipeId ? { ...e, portions } : e)))

  const retirer = (recipeId: string) => onBasket(basket.filter((e) => e.recipeId !== recipeId))

  if (basket.length === 0) {
    return (
      <>
        <h1>Panier</h1>
        <p className="vide">Rien pour l'instant. Choisissez des recettes dans « Proposer ».</p>
      </>
    )
  }

  return (
    <>
      <h1>Panier</h1>
      <p className="aide">Ajustez les parts, puis passez à la liste.</p>

      {basket.map((entree) => {
        const r = byId.get(entree.recipeId)
        if (!r) return null
        return (
          <div className="carte" key={entree.recipeId}>
            <h3>{r.titre}</h3>
            <div className="meta">{r.temps} min</div>
            <div className="ligne-panier">
              <div className="compteur">
                <button
                  onClick={() => setPortions(entree.recipeId, Math.max(1, entree.portions - 1))}
                  aria-label={`Moins de parts pour ${r.titre}`}
                >
                  −
                </button>
                <span>{entree.portions}</span>
                <button
                  onClick={() => setPortions(entree.recipeId, entree.portions + 1)}
                  aria-label={`Plus de parts pour ${r.titre}`}
                >
                  +
                </button>
              </div>
              <div className="rangee-boutons">
                <button className="discret" onClick={() => onCuisiner(r.id)}>
                  Cuisiner
                </button>
                <button className="discret" onClick={() => retirer(entree.recipeId)}>
                  Retirer
                </button>
              </div>
            </div>
          </div>
        )
      })}

      <button className="principal" onClick={onVersListe}>
        Voir la liste
      </button>
    </>
  )
}

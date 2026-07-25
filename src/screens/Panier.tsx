import type { BasketEntry, Recipe } from '../types'
import { teinteRecette } from '../lib/identite'
import Icone from '../components/Icone'

interface Props {
  recipes: Recipe[]
  basket: BasketEntry[]
  onBasket: (basket: BasketEntry[]) => void
  onCuisiner: (recipeId: string) => void
  onVersListe: () => void
  onAjouterRecette: () => void
}

export default function Panier({
  recipes,
  basket,
  onBasket,
  onCuisiner,
  onVersListe,
  onAjouterRecette,
}: Props) {
  const byId = new Map(recipes.map((r) => [r.id, r]))

  const setPortions = (recipeId: string, portions: number) =>
    onBasket(basket.map((e) => (e.recipeId === recipeId ? { ...e, portions } : e)))

  const retirer = (recipeId: string) => onBasket(basket.filter((e) => e.recipeId !== recipeId))

  if (basket.length === 0) {
    return (
      <>
        <header className="entete-app">
          <div className="entete-app-titre">
            <Icone nom="panier" />
            <h1>Panier</h1>
          </div>
        </header>
        <p className="vide">Rien pour l'instant. Choisissez des recettes dans « Proposer ».</p>
        <button className="carte-bento" onClick={onAjouterRecette}>
          <Icone nom="etoile" taille={28} />
          <p>Saisie automatique</p>
        </button>
      </>
    )
  }

  return (
    <>
      <header className="entete-app">
        <div className="entete-app-titre">
          <Icone nom="panier" />
          <h1>Panier</h1>
        </div>
      </header>

      <div className="carte-resume">
        <p className="carte-resume-label">Ma semaine</p>
        <h2 className="carte-resume-nombre">{basket.length} plats</h2>
      </div>

      <p className="aide">Ajustez les parts, puis passez à la liste.</p>

      {basket.map((entree) => {
        const r = byId.get(entree.recipeId)
        if (!r) return null
        return (
          <div className="carte carte-panier" key={entree.recipeId}>
            <div
              className="vignette-mini"
              aria-hidden="true"
              style={{ '--teinte': teinteRecette(r.titre) } as React.CSSProperties}
            >
              {r.image ? <img src={r.image} alt="" /> : r.titre.charAt(0)}
            </div>
            <div className="carte-panier-corps">
              <h3>{r.titre}</h3>
              <div className="ligne-panier">
                <div className="compteur">
                  <button
                    onClick={() => setPortions(entree.recipeId, Math.max(1, entree.portions - 1))}
                    aria-label={`Moins de parts pour ${r.titre}`}
                  >
                    <Icone nom="moins" taille={16} />
                  </button>
                  <span>{entree.portions}</span>
                  <button
                    onClick={() => setPortions(entree.recipeId, entree.portions + 1)}
                    aria-label={`Plus de parts pour ${r.titre}`}
                  >
                    <Icone nom="plus" taille={16} />
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
          </div>
        )
      })}

      <h2>Compléter ma semaine</h2>
      <button className="carte-bento" onClick={onAjouterRecette}>
        <Icone nom="etoile" taille={28} />
        <p>Saisie automatique</p>
      </button>

      <div className="espaceur-action-flottante" aria-hidden="true" />

      <div className="action-flottante">
        <button className="principal" onClick={onVersListe}>
          <Icone nom="panier" taille={20} /> Voir la liste
        </button>
      </div>
    </>
  )
}

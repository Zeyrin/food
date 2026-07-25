import { useMemo, useState } from 'react'
import type { BasketEntry, Recipe } from '../types'
import { type Historique, proposer, tousLesTags } from '../lib/propose'
import { teinteRecette } from '../lib/identite'
import Icone from '../components/Icone'

interface Props {
  recipes: Recipe[]
  propositions: Recipe[]
  historique: Historique
  basket: BasketEntry[]
  onBasket: (basket: BasketEntry[]) => void
}

const TEMPS = [20, 30, 45] as const

export default function Propose({ recipes, propositions, historique, basket, onBasket }: Props) {
  const [tempsMax, setTempsMax] = useState<number | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [graine, setGraine] = useState(0)

  const filtre = tempsMax !== null || tags.length > 0

  const affichees = useMemo(
    () =>
      filtre || graine
        ? proposer(recipes, historique, { tempsMax: tempsMax ?? undefined, tags, nombre: 8 })
        : propositions,
    // `graine` sert uniquement à relancer un tirage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [recipes, historique, tempsMax, tags, graine, propositions],
  )

  const dansPanier = (id: string) => basket.some((e) => e.recipeId === id)

  const basculer = (recette: Recipe) => {
    onBasket(
      dansPanier(recette.id)
        ? basket.filter((e) => e.recipeId !== recette.id)
        : [...basket, { recipeId: recette.id, portions: recette.portions }],
    )
  }

  const basculerTag = (t: string) =>
    setTags((prec) => (prec.includes(t) ? prec.filter((x) => x !== t) : [...prec, t]))

  return (
    <>
      <header className="entete-app">
        <div className="entete-app-titre">
          <Icone nom="grill" />
          <h1>Proposer</h1>
        </div>
      </header>
      <p className="aide">
        Ce qui a été cuisiné dans le mois est écarté. Touchez une recette pour l'ajouter au panier.
      </p>

      <div className="puces">
        {TEMPS.map((t) => (
          <button
            key={t}
            className="puce"
            aria-pressed={tempsMax === t}
            onClick={() => setTempsMax(tempsMax === t ? null : t)}
          >
            ≤ {t} min
          </button>
        ))}
      </div>

      <div className="puces">
        {tousLesTags(recipes).map((t) => (
          <button
            key={t}
            className="puce"
            aria-pressed={tags.includes(t)}
            onClick={() => basculerTag(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {affichees.length === 0 ? (
        <p className="vide">Aucune recette ne passe ces filtres.</p>
      ) : (
        affichees.map((r) => (
          <div
            key={r.id}
            className="carte carte-recette"
            style={{ '--teinte': teinteRecette(r.titre) } as React.CSSProperties}
          >
            <div className="vignette" aria-hidden="true">
              {r.image && <img src={r.image} alt="" />}
              <span className="badge-temps">
                <Icone nom="minuteur" taille={14} /> {r.temps} min
              </span>
              {!r.image && r.titre.charAt(0)}
            </div>
            <div className="carte-recette-corps">
              <div className="carte-recette-ligne">
                <h3>{r.titre}</h3>
                <button
                  className="bouton-ajout"
                  onClick={() => basculer(r)}
                  aria-pressed={dansPanier(r.id)}
                  aria-label={dansPanier(r.id) ? `Retirer ${r.titre} du panier` : `Ajouter ${r.titre} au panier`}
                >
                  <Icone nom={dansPanier(r.id) ? 'coche' : 'plus'} taille={20} />
                </button>
              </div>
              <div className="puces-info">
                <span className="puce-info">{r.portions} parts</span>
                {r.tags.map((t) => (
                  <span className="puce-info" key={t}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))
      )}

      <button className="discret suite" onClick={() => setGraine((g) => g + 1)}>
        Autres idées
      </button>
    </>
  )
}

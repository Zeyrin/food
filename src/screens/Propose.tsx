import { useMemo, useState } from 'react'
import type { BasketEntry, Recipe } from '../types'
import { type Historique, proposer, tousLesTags } from '../lib/propose'

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
      <h1>Qu'est-ce qu'on mange</h1>
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
          <button
            key={r.id}
            className="carte"
            style={{ display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer' }}
            onClick={() => basculer(r)}
            aria-pressed={dansPanier(r.id)}
          >
            <h3>
              {dansPanier(r.id) ? '✓ ' : ''}
              {r.titre}
            </h3>
            <div className="meta">
              {r.temps} min · {r.portions} parts · {r.tags.join(', ')}
            </div>
          </button>
        ))
      )}

      <button className="discret" onClick={() => setGraine((g) => g + 1)} style={{ marginTop: 12 }}>
        Autres idées
      </button>
    </>
  )
}

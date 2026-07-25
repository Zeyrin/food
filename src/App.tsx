import { useCallback, useEffect, useMemo, useState } from 'react'
import corpus from './data/recipes.json'
import type { BasketEntry, ListState, Recipe, Verdict } from './types'
import { buildList } from './lib/aggregate'
import { type Historique, proposer } from './lib/propose'
import {
  creerFoyer,
  ecrireBasket,
  lireBasket,
  lireFoyer,
  lireHistorique,
  marquerCuisine,
} from './lib/local'
import { ajouterRecette, ecrireListe, lireListe, lireRecettes, suivreListe, suivreRecettes } from './lib/sync'
import Propose from './screens/Propose'
import Panier from './screens/Panier'
import Liste from './screens/Liste'
import Cuisson from './screens/Cuisson'
import CuissonListe from './screens/CuissonListe'
import AjouterRecette from './screens/AjouterRecette'
import Icone from './components/Icone'

const CORPUS: Recipe[] = corpus as Recipe[]

type Onglet = 'propose' | 'panier' | 'liste' | 'cuisson'

const ETAT_VIDE: ListState = { coche: {}, dejaPossede: {} }

export default function App() {
  const [onglet, setOnglet] = useState<Onglet>('propose')
  const [enCuisson, setEnCuisson] = useState<string | null>(null)
  const [enAjout, setEnAjout] = useState(false)

  const [basket, setBasket] = useState<BasketEntry[]>([])
  const [historique, setHistorique] = useState<Historique>({ derniereFois: {}, verdicts: {} })
  const [foyer, setFoyer] = useState<string | null>(null)
  const [etatListe, setEtatListe] = useState<ListState>(ETAT_VIDE)
  const [recettesAjoutees, setRecettesAjoutees] = useState<Recipe[]>([])

  const recipes = useMemo(() => [...CORPUS, ...recettesAjoutees], [recettesAjoutees])

  // Amorçage : local d'abord, réseau ensuite. L'app est utilisable
  // avant que Supabase ait répondu.
  useEffect(() => {
    void (async () => {
      setBasket(await lireBasket())
      setHistorique(await lireHistorique())
      setFoyer((await lireFoyer()) ?? (await creerFoyer()))
    })()
  }, [])

  useEffect(() => {
    if (!foyer) return
    void lireListe(foyer).then(setEtatListe)
    return suivreListe(foyer, setEtatListe)
  }, [foyer])

  useEffect(() => {
    if (!foyer) return
    void lireRecettes(foyer).then(setRecettesAjoutees)
    return suivreRecettes(foyer, (r) => setRecettesAjoutees((prec) => [...prec, r]))
  }, [foyer])

  const ajouter = useCallback(
    async (recette: Recipe) => {
      if (!foyer) throw new Error('Foyer non initialisé, réessayez dans un instant.')
      await ajouterRecette(foyer, recette)
      setRecettesAjoutees((prec) => [...prec, recette])
    },
    [foyer],
  )

  const majBasket = useCallback((suivant: BasketEntry[]) => {
    setBasket(suivant)
    void ecrireBasket(suivant)
  }, [])

  const majListe = useCallback(
    (suivant: ListState) => {
      setEtatListe(suivant)
      if (foyer) void ecrireListe(foyer, suivant)
    },
    [foyer],
  )

  const verdict = useCallback(async (recipeId: string, v: Verdict) => {
    setHistorique(await marquerCuisine(recipeId, v))
  }, [])

  const propositions = useMemo(
    () => proposer(recipes, historique, { nombre: 8 }),
    // Une nouvelle sélection à chaque changement d'historique ou de
    // catalogue, pas à chaque rendu — sinon les cartes dansent sous
    // le doigt.
    [recipes, historique],
  )

  const items = useMemo(() => buildList(basket, recipes), [basket])

  if (enCuisson) {
    const recette = recipes.find((r) => r.id === enCuisson)
    if (recette) {
      return (
        <Cuisson
          recette={recette}
          onVerdict={async (v) => {
            await verdict(recette.id, v)
            setEnCuisson(null)
          }}
          onQuitter={() => setEnCuisson(null)}
        />
      )
    }
  }

  if (enAjout) {
    return <AjouterRecette onAjouter={ajouter} onQuitter={() => setEnAjout(false)} />
  }

  return (
    <>
      {onglet === 'propose' && (
        <Propose
          recipes={recipes}
          propositions={propositions}
          historique={historique}
          basket={basket}
          onBasket={majBasket}
        />
      )}

      {onglet === 'panier' && (
        <Panier
          recipes={recipes}
          basket={basket}
          onBasket={majBasket}
          onCuisiner={setEnCuisson}
          onVersListe={() => setOnglet('liste')}
          onAjouterRecette={() => setEnAjout(true)}
        />
      )}

      {onglet === 'liste' && (
        <Liste
          items={items}
          etat={etatListe}
          onEtat={majListe}
          foyer={foyer}
          prochaineCuisson={recipes.find((r) => r.id === basket[0]?.recipeId) ?? null}
        />
      )}

      {onglet === 'cuisson' && (
        <CuissonListe recipes={recipes} basket={basket} onCuisiner={setEnCuisson} />
      )}

      <nav className="onglets">
        {(
          [
            ['propose', 'etoile', 'Proposer'],
            ['panier', 'panier', `Panier${basket.length ? ` (${basket.length})` : ''}`],
            ['liste', 'liste', 'Liste'],
            ['cuisson', 'grill', 'Cuisson'],
          ] as const
        ).map(([cle, icone, label]) => (
          <button
            key={cle}
            onClick={() => setOnglet(cle)}
            aria-current={onglet === cle ? 'page' : undefined}
          >
            <Icone nom={icone} taille={22} />
            {label}
          </button>
        ))}
      </nav>
    </>
  )
}

import { useCallback, useEffect, useMemo, useState } from 'react'
import corpus from './data/recipes.json'
import type { BasketEntry, ListState, Recipe, Verdict } from './types'
import { buildList } from './lib/aggregate'
import { type Historique } from './lib/propose'
import {
  ecrireBasket,
  lireBasket,
  lireCodeFoyer,
  lireFoyer,
  lireHistorique,
  marquerCuisine,
  quitterFoyer,
  rejoindreFoyer,
} from './lib/local'
import {
  ajouterRecette,
  ecrireHistoriqueFoyer,
  ecrireListe,
  lireHistoriqueFoyer,
  lireListe,
  lireRecettes,
  modifierRecette,
  semerCorpusInitial,
  supabase,
  supprimerRecette,
  suivreHistorique,
  suivreListe,
  suivreRecettes,
} from './lib/sync'
import { creerFoyerAvecCode, resoudreCode } from './lib/foyer'
import DetailRecette from './screens/DetailRecette'
import Propose from './screens/Propose'
import Panier from './screens/Panier'
import Liste from './screens/Liste'
import Cuisson from './screens/Cuisson'
import CuissonListe from './screens/CuissonListe'
import AjouterRecette from './screens/AjouterRecette'
import Bienvenue from './screens/Bienvenue'
import Reglages from './screens/Reglages'
import Icone from './components/Icone'

const CORPUS: Recipe[] = corpus as Recipe[]

type Onglet = 'propose' | 'panier' | 'liste' | 'cuisson'

const ETAT_VIDE: ListState = { coche: {}, dejaPossede: {} }

export default function App() {
  const [onglet, setOnglet] = useState<Onglet>('propose')
  const [enCuisson, setEnCuisson] = useState<string | null>(null)
  const [enAjout, setEnAjout] = useState(false)
  const [enReglages, setEnReglages] = useState(false)
  const [enDetail, setEnDetail] = useState<string | null>(null)
  const [enEdition, setEnEdition] = useState<Recipe | null>(null)

  const [basket, setBasket] = useState<BasketEntry[]>([])
  const [historique, setHistorique] = useState<Historique>({ derniereFois: {}, verdicts: {} })
  const [foyer, setFoyer] = useState<string | null>(null)
  const [codeFoyer, setCodeFoyer] = useState<string | null>(null)
  const [foyerCharge, setFoyerCharge] = useState(false)
  const [etatListe, setEtatListe] = useState<ListState>(ETAT_VIDE)
  const [recipes, setRecipes] = useState<Recipe[]>([])

  // Amorçage : local d'abord, réseau ensuite. L'app est utilisable
  // avant que Supabase ait répondu. Sans foyer connu (premier
  // lancement sur cet appareil, ni lien ni stockage local), on ne
  // crée plus de foyer en douce — l'écran Bienvenue le demande
  // explicitement, pour éviter les foyers orphelins créés par
  // inadvertance (un par appareil/navigateur ouvert sans lien).
  // `foyerCharge` distingue « pas encore lu » de « vraiment absent »,
  // pour ne pas flasher Bienvenue le temps que IndexedDB réponde.
  useEffect(() => {
    void (async () => {
      setBasket(await lireBasket())
      setHistorique(await lireHistorique())
      setFoyer(await lireFoyer())
      setCodeFoyer(await lireCodeFoyer())
      setFoyerCharge(true)
    })()
  }, [])

  const creer = useCallback(async () => {
    const { id, code } = await creerFoyerAvecCode()
    await rejoindreFoyer(id, code)
    setFoyer(id)
    setCodeFoyer(code)
  }, [])

  const rejoindre = useCallback(async (code: string) => {
    const id = await resoudreCode(code)
    if (!id) return false
    await rejoindreFoyer(id, code)
    setFoyer(id)
    setCodeFoyer(code)
    return true
  }, [])

  const quitter = useCallback(async () => {
    await quitterFoyer()
    setFoyer(null)
    setCodeFoyer(null)
    setRecipes([])
    setEnReglages(false)
  }, [])

  const rejoindreDepuisReglages = useCallback(
    async (code: string) => {
      const ok = await rejoindre(code)
      if (ok) setEnReglages(false)
      return ok
    },
    [rejoindre],
  )

  useEffect(() => {
    if (!foyer) return
    void lireListe(foyer).then(setEtatListe)
    return suivreListe(foyer, setEtatListe)
  }, [foyer])

  // Le catalogue vit entièrement dans Supabase. Un foyer tout neuf
  // (aucune ligne dans `recettes`) est peuplé une fois avec le corpus
  // de départ ; les foyers déjà semés se contentent de le lire. Sans
  // Supabase configuré, on retombe sur le corpus en mémoire — l'app
  // reste utilisable, juste sans synchro.
  useEffect(() => {
    if (!foyer) return
    if (!supabase) {
      setRecipes(CORPUS)
      return
    }
    void (async () => {
      const existantes = await lireRecettes(foyer)
      setRecipes(existantes.length > 0 ? existantes : await semerCorpusInitial(foyer, CORPUS))
    })()
    return suivreRecettes(foyer, setRecipes)
  }, [foyer])

  // L'historique suit le même chemin que la liste : il vit dans le
  // foyer. Le local sert d'amorce hors ligne et de repli tant que
  // Supabase n'a pas répondu.
  useEffect(() => {
    if (!foyer) return
    void lireHistoriqueFoyer(foyer).then((distant) => {
      if (distant) setHistorique(distant)
    })
    return suivreHistorique(foyer, setHistorique)
  }, [foyer])

  const ajouter = useCallback(
    async (recette: Recipe) => {
      if (!foyer) throw new Error('Foyer non initialisé, réessayez dans un instant.')
      await ajouterRecette(foyer, recette)
      setRecipes((prec) => [...prec, recette])
    },
    [foyer],
  )

  const modifier = useCallback(
    async (recette: Recipe) => {
      if (!foyer) throw new Error('Foyer non initialisé.')
      await modifierRecette(foyer, recette)
      setRecipes((prec) => prec.map((r) => (r.id === recette.id ? recette : r)))
    },
    [foyer],
  )

  const supprimer = useCallback(
    async (recipeId: string) => {
      if (!foyer) return
      await supprimerRecette(foyer, recipeId)
      setRecipes((prec) => prec.filter((r) => r.id !== recipeId))
      setBasket((prec) => prec.filter((e) => e.recipeId !== recipeId))
      setEnDetail(null)
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

  const verdict = useCallback(
    async (recipeId: string, v: Verdict) => {
      const suivant = await marquerCuisine(recipeId, v)
      setHistorique(suivant)
      if (foyer) void ecrireHistoriqueFoyer(foyer, suivant)
    },
    [foyer],
  )

  // `recipes` compte autant que `basket` : le catalogue arrive après coup
  // (lecture Supabase, puis temps réel). Sans lui dans les dépendances, la
  // liste reste celle calculée sur un catalogue vide au premier rendu.
  const items = useMemo(() => buildList(basket, recipes), [basket, recipes])

  if (!foyerCharge) return null

  if (!foyer) {
    return <Bienvenue onCreer={creer} onRejoindre={rejoindre} />
  }

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

  if (enEdition) {
    return (
      <AjouterRecette
        recetteInitiale={enEdition}
        onAjouter={(r) => modifier({ ...r, id: enEdition.id })}
        onQuitter={() => setEnEdition(null)}
      />
    )
  }

  if (enAjout) {
    return <AjouterRecette onAjouter={ajouter} onQuitter={() => setEnAjout(false)} />
  }

  if (enDetail) {
    const recette = recipes.find((r) => r.id === enDetail)
    if (recette) {
      return (
        <DetailRecette
          recette={recette}
          dansPanier={basket.some((e) => e.recipeId === recette.id)}
          onBasculerPanier={() =>
            majBasket(
              basket.some((e) => e.recipeId === recette.id)
                ? basket.filter((e) => e.recipeId !== recette.id)
                : [...basket, { recipeId: recette.id, portions: recette.portions }],
            )
          }
          onCuisiner={() => setEnCuisson(recette.id)}
          onModifier={() => setEnEdition(recette)}
          onSupprimer={() => void supprimer(recette.id)}
          onFermer={() => setEnDetail(null)}
        />
      )
    }
  }

  if (enReglages) {
    return (
      <Reglages
        codeFoyer={codeFoyer}
        onRejoindre={rejoindreDepuisReglages}
        onQuitter={quitter}
        onFermer={() => setEnReglages(false)}
      />
    )
  }

  return (
    <>
      <button
        className="bouton-rond-discret bouton-reglages-global"
        onClick={() => setEnReglages(true)}
        aria-label="Réglages"
      >
        <Icone nom="menu" taille={20} />
      </button>

      {onglet === 'propose' && (
        <Propose
          recipes={recipes}
          historique={historique}
          basket={basket}
          onBasket={majBasket}
          onDetail={setEnDetail}
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

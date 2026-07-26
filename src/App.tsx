import { useCallback, useEffect, useMemo, useState } from 'react'
import { flushSync } from 'react-dom'
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
import { useEnLigne } from './hooks/useEnLigne'

const CORPUS: Recipe[] = corpus as Recipe[]

type Onglet = 'propose' | 'panier' | 'liste' | 'cuisson'

/**
 * Un seul écran affiché à la fois, mais empilé plutôt que dans des
 * flags séparés : « reculer » devient « dépiler », que ce soit via un
 * bouton de l'appli ou le bouton retour du téléphone/navigateur. Sans
 * ça, l'appli n'a qu'une seule page dans l'historique du navigateur —
 * retour en sort directement au lieu de reculer d'un écran.
 */
type Vue =
  | { type: 'onglet'; onglet: Onglet }
  | { type: 'detail'; recipeId: string }
  | { type: 'ajout' }
  | { type: 'edition'; recette: Recipe }
  | { type: 'cuisson'; recipeId: string }
  | { type: 'reglages' }

const ETAT_VIDE: ListState = { coche: {}, dejaPossede: {} }
const PILE_INITIALE: Vue[] = [{ type: 'onglet', onglet: 'propose' }]
const CLE_PILE = 'courses:pile'

/**
 * Pull-to-refresh (Android/Chrome) et rechargement manuel restent
 * possibles — on ne bloque pas le geste. Mais un vrai rechargement
 * redémarre React de zéro : sans ça, on retomberait sur l'accueil à
 * chaque refresh. `sessionStorage` survit au rechargement (pas à la
 * fermeture de l'onglet, ce qui est très bien : une vraie nouvelle
 * session repart de l'accueil).
 */
function lirePileSauvegardee(): Vue[] {
  try {
    const brut = sessionStorage.getItem(CLE_PILE)
    if (!brut) return PILE_INITIALE
    const pile = JSON.parse(brut) as Vue[]
    return Array.isArray(pile) && pile.length > 0 ? pile : PILE_INITIALE
  } catch {
    return PILE_INITIALE
  }
}

export default function App() {
  const [pile, setPile] = useState<Vue[]>(lirePileSauvegardee)
  const vueActuelle = pile[pile.length - 1]!

  useEffect(() => {
    try {
      sessionStorage.setItem(CLE_PILE, JSON.stringify(pile))
    } catch {
      /* stockage plein ou navigation privée stricte : tant pis, juste pas de reprise au refresh */
    }
  }, [pile])

  // Transition d'écran native (View Transitions API) : zéro dépendance,
  // se désactive toute seule sur les navigateurs qui ne la supportent
  // pas (retombe sur `appliquer()` direct, comportement d'avant) et sur
  // « réduire les animations » (le CSS `prefers-reduced-motion` ne
  // couvre pas les pseudo-éléments ::view-transition-*, donc la garde
  // se fait ici). `flushSync` force le commit React synchrone attendu
  // par `startViewTransition` — sans lui, l'API capture l'ancien DOM
  // des deux côtés, avant que React n'ait appliqué le changement.
  const avecTransition = useCallback((direction: 'avant' | 'arriere', appliquer: () => void) => {
    const reduitMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const demarrer = (document as Document & { startViewTransition?: (cb: () => void) => void })
      .startViewTransition
    if (reduitMotion || !demarrer) {
      appliquer()
      return
    }
    document.documentElement.dataset.navDir = direction
    demarrer.call(document, () => flushSync(appliquer))
  }, [])

  // Avancer pousse une entrée dans l'historique du navigateur, avec la
  // profondeur qu'elle représente ; reculer (bouton de l'appli ou
  // bouton physique/navigateur) resynchronise `pile` sur cette
  // profondeur via `popstate` ci-dessous. Un seul chemin pour les
  // deux, jamais de pop direct de `pile` ailleurs — sinon la pile
  // React et l'historique du navigateur désynchronisent. La
  // profondeur (plutôt qu'un simple « dépiler un cran ») encaisse
  // aussi un retour qui saute plusieurs crans d'un coup — menu
  // d'historique en appui long sur Android, geste de bord iOS.
  const irVers = useCallback(
    (vue: Vue) => {
      avecTransition('avant', () => {
        setPile((p) => {
          const suivante = [...p, vue]
          history.pushState({ profondeur: suivante.length }, '')
          return suivante
        })
      })
    },
    [avecTransition],
  )

  const reculer = useCallback(() => {
    history.back()
  }, [])

  useEffect(() => {
    const surRetour = (e: PopStateEvent) => {
      const profondeur = Math.max(1, (e.state as { profondeur?: number } | null)?.profondeur ?? 1)
      avecTransition('arriere', () => {
        setPile((p) => (profondeur < p.length ? p.slice(0, profondeur) : p))
      })
    }
    window.addEventListener('popstate', surRetour)
    return () => window.removeEventListener('popstate', surRetour)
  }, [avecTransition])

  const changerOnglet = useCallback(
    (cle: Onglet) => {
      if (vueActuelle.type === 'onglet' && vueActuelle.onglet === cle) return
      irVers({ type: 'onglet', onglet: cle })
    },
    [vueActuelle, irVers],
  )

  const [historique, setHistorique] = useState<Historique>({ derniereFois: {}, verdicts: {} })
  const [foyer, setFoyer] = useState<string | null>(null)
  const [codeFoyer, setCodeFoyer] = useState<string | null>(null)
  const [foyerCharge, setFoyerCharge] = useState(false)
  const [etatListe, setEtatListe] = useState<ListState>(ETAT_VIDE)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const enLigne = useEnLigne()

  // Le panier n'a pas d'état à lui : il fait partie de la liste du foyer.
  // Une seule source de vérité, une seule écriture réseau — impossible que
  // le panier et les cases cochées partent chacun de leur côté.
  const basket = etatListe.panier ?? []

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
      const panier = await lireBasket()
      setEtatListe((prec) => ({ ...prec, panier }))
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
    // Sans ça, la liste et le panier de l'ancien foyer restent en mémoire
    // et seraient réécrits dans le prochain foyer rejoint.
    setEtatListe(ETAT_VIDE)
    setHistorique({ derniereFois: {}, verdicts: {} })
    // Reset direct plutôt que `reculer()` : on quitte le foyer entier,
    // pas juste l'écran réglages — l'écran Bienvenue qui suit ne fait
    // de toute façon pas partie de cette pile.
    setPile([{ type: 'onglet', onglet: 'propose' }])
  }, [])

  const rejoindreDepuisReglages = useCallback(
    async (code: string) => {
      const ok = await rejoindre(code)
      if (ok) reculer()
      return ok
    },
    [rejoindre, reculer],
  )

  // Le panier arrive avec la liste. Tant que le foyer n'en a pas publié
  // un (ligne `listes` créée avant que le panier ne soit partagé), on
  // garde celui d'ici : sinon rejoindre un foyer viderait le panier en
  // cours de constitution.
  useEffect(() => {
    if (!foyer) return
    const appliquer = (distant: ListState) =>
      setEtatListe((local) => ({ ...distant, panier: distant.panier ?? local.panier }))
    void lireListe(foyer).then(appliquer)
    return suivreListe(foyer, appliquer)
  }, [foyer])

  // Copie hors ligne du panier : au rayon sans réseau, la liste doit
  // quand même pouvoir se calculer. On n'écrit qu'une fois le local
  // relu, sinon le premier rendu (panier vide) l'effacerait.
  useEffect(() => {
    if (foyerCharge) void ecrireBasket(basket)
  }, [foyerCharge, basket])

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

  const majListe = useCallback(
    (suivant: ListState) => {
      setEtatListe(suivant)
      if (foyer) void ecrireListe(foyer, suivant)
    },
    [foyer],
  )

  const majBasket = useCallback(
    (suivant: BasketEntry[]) => majListe({ ...etatListe, panier: suivant }),
    [etatListe, majListe],
  )

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
      majBasket(basket.filter((e) => e.recipeId !== recipeId))
      reculer()
    },
    [foyer, basket, majBasket, reculer],
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

  if (vueActuelle.type === 'cuisson') {
    const recette = recipes.find((r) => r.id === vueActuelle.recipeId)
    if (recette) {
      return (
        <Cuisson
          recette={recette}
          onVerdict={async (v) => {
            await verdict(recette.id, v)
            reculer()
          }}
          onQuitter={reculer}
        />
      )
    }
  }

  if (vueActuelle.type === 'edition') {
    const { recette } = vueActuelle
    return (
      <AjouterRecette
        recetteInitiale={recette}
        onAjouter={(r) => modifier({ ...r, id: recette.id })}
        onQuitter={reculer}
      />
    )
  }

  if (vueActuelle.type === 'ajout') {
    return <AjouterRecette onAjouter={ajouter} onQuitter={reculer} />
  }

  if (vueActuelle.type === 'detail') {
    const recette = recipes.find((r) => r.id === vueActuelle.recipeId)
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
          onCuisiner={() => irVers({ type: 'cuisson', recipeId: recette.id })}
          onModifier={() => irVers({ type: 'edition', recette })}
          onSupprimer={() => void supprimer(recette.id)}
          onFermer={reculer}
        />
      )
    }
  }

  if (vueActuelle.type === 'reglages') {
    return (
      <Reglages
        codeFoyer={codeFoyer}
        onRejoindre={rejoindreDepuisReglages}
        onQuitter={quitter}
        onFermer={reculer}
      />
    )
  }

  const onglet = vueActuelle.type === 'onglet' ? vueActuelle.onglet : 'propose'

  return (
    <>
      <button
        className="bouton-rond-discret bouton-reglages-global"
        onClick={() => irVers({ type: 'reglages' })}
        aria-label="Réglages"
      >
        <Icone nom="menu" taille={20} />
      </button>

      {!enLigne && (
        <p className="pastille-hors-ligne" role="status">
          <Icone nom="alerte" taille={16} /> Hors ligne — vos changements se synchroniseront au retour du réseau
        </p>
      )}

      {onglet === 'propose' && (
        <Propose
          recipes={recipes}
          historique={historique}
          basket={basket}
          onBasket={majBasket}
          onDetail={(recipeId) => irVers({ type: 'detail', recipeId })}
        />
      )}

      {onglet === 'panier' && (
        <Panier
          recipes={recipes}
          basket={basket}
          onBasket={majBasket}
          onVersPropose={() => changerOnglet('propose')}
          onVersListe={() => changerOnglet('liste')}
          onAjouterRecette={() => irVers({ type: 'ajout' })}
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
        <CuissonListe
          recipes={recipes}
          basket={basket}
          onCuisiner={(recipeId) => irVers({ type: 'cuisson', recipeId })}
        />
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
            onClick={() => changerOnglet(cle)}
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

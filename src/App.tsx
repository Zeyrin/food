import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import corpus from './data/recipes.json'
import type { BasketEntry, ListState, Onglet, Recipe, Verdict } from './types'
import { buildList, redimensionnerRecette } from './lib/aggregate'
import { cuisineRecemment, tousLesTags, type Historique } from './lib/propose'
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
import ModifierRecette from './screens/ModifierRecette'
import Bienvenue from './screens/Bienvenue'
import TourGuide from './components/TourGuide'
import BandeauMinuteur from './components/BandeauMinuteur'
import PanneauMinuteurs from './components/PanneauMinuteurs'
import { useMinuteurs } from './hooks/useMinuteurs'
import { ecouterClicNotification } from './lib/minuteurs'
import { useMagasins } from './hooks/useMagasins'
import Reglages from './screens/Reglages'
import Icone from './components/Icone'
import { useEnLigne } from './hooks/useEnLigne'
import { useDecalageBarreOutils } from './hooks/useDecalageBarreOutils'
import { useLangue } from './lib/i18n'
import { suivre, type Ecran } from './lib/analytique'

const CORPUS: Recipe[] = corpus as Recipe[]

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
  | { type: 'edition'; recette: Recipe }
  | { type: 'cuisson'; recipeId: string }
  | { type: 'reglages' }

const ETAT_VIDE: ListState = { coche: {}, dejaPossede: {} }
const PILE_INITIALE: Vue[] = [{ type: 'onglet', onglet: 'propose' }]
const CLE_PILE = 'courses:pile'
// Par appareil, pas par foyer : une présentation déjà vue ici ne doit pas
// se redéclencher parce qu'on a rejoint un nouveau foyer sur ce téléphone.
const CLE_ONBOARDING_VU = 'fffood:onboarding-vu'

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
    const pile = (JSON.parse(brut) as Vue[]).filter(
      // « ajout » était un écran à lui seul ; il vit maintenant dans
      // « Proposer ». Une session rechargée après la mise à jour ne doit
      // pas rester bloquée sur une vue qui ne s'affiche plus.
      (vue) => (vue as { type?: string }).type !== 'ajout',
    )
    return Array.isArray(pile) && pile.length > 0 ? pile : PILE_INITIALE
  } catch {
    return PILE_INITIALE
  }
}

export default function App() {
  const { t } = useLangue()
  useDecalageBarreOutils()
  const [pile, setPile] = useState<Vue[]>(lirePileSauvegardee)
  const vueActuelle = pile[pile.length - 1]!

  /**
   * Défilement mémorisé par profondeur de pile. Une SPA garde la
   * position de la page entre deux écrans : ouvrir une recette depuis
   * le bas de la grille arrivait au milieu de sa fiche, et revenir
   * repartait du haut du catalogue — deux fois le mauvais endroit.
   * Avancer remet donc en haut, reculer rend la place qu'on occupait.
   */
  const positions = useRef<number[]>([])

  /**
   * Deux passes : au moment où React vient de commiter, la hauteur du
   * document est encore parfois celle de l'écran qu'on quitte, et le
   * navigateur rogne le défilement demandé à ce maximum-là (revenir au
   * bas d'un long catalogue depuis une fiche courte atterrissait au
   * milieu). La seconde passe, une frame plus tard, tombe juste.
   */
  /**
   * La profondeur vit déjà dans l'état d'historique : on s'en sert comme
   * index plutôt que de lire `pile`, pour pouvoir noter la position
   * *avant* la navigation, hors de l'updater React. Le faire dedans
   * marchait par accident — sans `startViewTransition` (navigateur qui
   * ne l'a pas, ou « réduire les animations »), l'updater est différé et
   * s'exécutait après le retour en haut de page : on mémorisait zéro.
   */
  const profondeurActuelle = () =>
    (history.state as { profondeur?: number } | null)?.profondeur ?? 1

  const defilerVers = useCallback((y: number) => {
    window.scrollTo(0, y)
    if (y > 0) requestAnimationFrame(() => window.scrollTo(0, y))
  }, [])

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
      positions.current[profondeurActuelle() - 1] = window.scrollY
      avecTransition('avant', () => {
        setPile((p) => {
          const suivante = [...p, vue]
          history.pushState({ profondeur: suivante.length }, '')
          return suivante
        })
        defilerVers(0)
      })
    },
    [avecTransition, defilerVers],
  )

  const reculer = useCallback(() => {
    history.back()
  }, [])

  useEffect(() => {
    const surRetour = (e: PopStateEvent) => {
      const profondeur = Math.max(1, (e.state as { profondeur?: number } | null)?.profondeur ?? 1)
      avecTransition('arriere', () => {
        setPile((p) => (profondeur < p.length ? p.slice(0, profondeur) : p))
        defilerVers(positions.current[profondeur - 1] ?? 0)
      })
    }
    window.addEventListener('popstate', surRetour)
    return () => window.removeEventListener('popstate', surRetour)
  }, [avecTransition, defilerVers])

  const changerOnglet = useCallback(
    (cle: Onglet) => {
      if (vueActuelle.type === 'onglet' && vueActuelle.onglet === cle) return
      if (vueActuelle.type === 'onglet') {
        irVers({ type: 'onglet', onglet: cle })
        return
      }
      // Depuis un écran plein page (détail, ajout, réglages…), le rail
      // desktop reste visible et ses boutons cliquables : basculer
      // d'onglet doit alors remplacer cet écran plutôt que l'empiler,
      // sinon « précédent » y ramènerait au lieu de reculer vers ce qui
      // était ouvert avant.
      avecTransition('avant', () => {
        setPile((p) => {
          const suivante = [...p.slice(0, -1), { type: 'onglet' as const, onglet: cle }]
          history.replaceState({ profondeur: suivante.length }, '')
          return suivante
        })
        defilerVers(0)
      })
    },
    [vueActuelle, irVers, avecTransition, defilerVers],
  )

  /**
   * Ajouter une recette n'est plus un écran : c'est une section de
   * « Proposer », ouverte ici pour que le bouton du Panier puisse
   * changer d'onglet et la déplier du même geste.
   */
  const [ajoutOuvert, setAjoutOuvert] = useState(false)
  const ouvrirAjout = useCallback(() => {
    setAjoutOuvert(true)
    changerOnglet('propose')
  }, [changerOnglet])

  // Bascule d'onglet sans empiler d'entrée d'historique — utilisée par
  // la visite guidée pour amener le bon écran derrière chaque repère.
  // Une vraie navigation (`changerOnglet`) ferait reculer l'utilisateur
  // d'un cran par étape au lieu de refermer la visite.
  const forcerOnglet = useCallback((cle: Onglet) => {
    setPile((p) => {
      const dernier = p[p.length - 1]
      if (dernier?.type === 'onglet' && dernier.onglet === cle) return p
      return [...p.slice(0, -1), { type: 'onglet', onglet: cle }]
    })
  }, [])

  const [onboardingVu, setOnboardingVu] = useState(
    () => localStorage.getItem(CLE_ONBOARDING_VU) === '1',
  )
  const terminerOnboarding = useCallback(() => {
    try {
      localStorage.setItem(CLE_ONBOARDING_VU, '1')
    } catch {
      /* stockage plein ou navigation privée stricte : tant pis, la présentation se redéclenchera */
    }
    setOnboardingVu(true)
  }, [])
  // Rouvre la visite depuis Réglages sans toucher au drapeau déjà
  // enregistré : à la fin, `terminerOnboarding` le réécrit simplement à
  // la même valeur. On repart de l'onglet Proposer — la visite y
  // commence toujours — plutôt que de laisser l'écran Réglages ouvert
  // dessous.
  const revoirOnboarding = useCallback(() => {
    setPile([{ type: 'onglet', onglet: 'propose' }])
    setOnboardingVu(false)
  }, [])

  /**
   * Au clavier ou au lecteur d'écran, changer d'écran ne déplaçait pas
   * le focus : il restait sur le bouton d'un écran désormais démonté,
   * donc renvoyé au début du document, et la lecture ne disait pas où
   * on venait d'arriver. On le pose sur le titre de l'écran — pas
   * pendant la visite guidée, dont la carte a ses propres boutons.
   */
  const premierRendu = useRef(true)
  useEffect(() => {
    if (premierRendu.current) {
      premierRendu.current = false
      return
    }
    if (!onboardingVu) return
    const titre = document.querySelector('h1')
    if (!titre) return
    titre.tabIndex = -1
    titre.focus({ preventScroll: true })
  }, [vueActuelle, onboardingVu])

  const [historique, setHistorique] = useState<Historique>({ derniereFois: {}, verdicts: {} })
  const [foyer, setFoyer] = useState<string | null>(null)
  const [codeFoyer, setCodeFoyer] = useState<string | null>(null)
  const [foyerCharge, setFoyerCharge] = useState(false)
  const [etatListe, setEtatListe] = useState<ListState>(ETAT_VIDE)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const enLigne = useEnLigne()

  /**
   * Les minuteurs vivent ici, pas dans l'écran de cuisson : on en lance
   * un précisément pour aller faire autre chose, et jusqu'ici quitter
   * cet écran les effaçait tous. Ils suivent donc l'app entière — un
   * bandeau les rappelle sur tous les écrans, et ils survivent au
   * rechargement (voir lib/minuteurs.ts).
   */
  const minuteurs = useMinuteurs()

  // Les magasins du foyer : combien d'arrêts, et quel rayon dans lequel.
  // Un seul magasin par défaut — la liste n'est alors qu'une suite de
  // rayons (voir lib/magasins.ts).
  const magasins = useMagasins()
  const [panneauMinuteurs, setPanneauMinuteurs] = useState(false)

  // Quand ça sonne, le panneau s'ouvre tout seul, où qu'on soit dans
  // l'app. Sur `.length` et non sur le tableau : refermer le panneau
  // pendant que ça sonne encore ne doit pas le rouvrir aussitôt.
  const nombreQuiSonnent = minuteurs.sonnent.length
  useEffect(() => {
    if (nombreQuiSonnent > 0) setPanneauMinuteurs(true)
  }, [nombreQuiSonnent])

  // Toucher la notification d'un minuteur ramène ici : le service worker
  // focalise la fenêtre (ou la rouvre), et nous dit d'ouvrir le panneau —
  // y compris s'il avait été refermé pendant que ça sonnait encore.
  useEffect(() => ecouterClicNotification(() => setPanneauMinuteurs(true)), [])

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
      try {
        const panier = await lireBasket()
        setEtatListe((prec) => ({ ...prec, panier }))
        setHistorique(await lireHistorique())
        setFoyer(await lireFoyer())
        setCodeFoyer(await lireCodeFoyer())
      } finally {
        // Quoi qu'il arrive à la lecture locale : sans ce `finally`,
        // un seul rejet laissait `foyerCharge` à `false`, et le
        // `return null` plus bas devenait un écran blanc définitif.
        // `lib/local.ts` neutralise déjà l'absence de stockage ; ceci
        // couvre le reste — l'app démarre, quitte à ne rien retrouver.
        setFoyerCharge(true)
      }
    })()
  }, [])

  const creer = useCallback(async () => {
    const { id, code } = await creerFoyerAvecCode()
    await rejoindreFoyer(id, code)
    setFoyer(id)
    setCodeFoyer(code)
    // Ni l'identifiant ni le code : ce sont les clés de la liste
    // (voir lib/analytique.ts). Seul le fait compte.
    suivre('foyer_cree')
  }, [])

  const rejoindre = useCallback(async (code: string) => {
    const id = await resoudreCode(code)
    if (!id) return false
    await rejoindreFoyer(id, code)
    setFoyer(id)
    setCodeFoyer(code)
    // Un second téléphone dans le foyer : l'app fait enfin ce pour
    // quoi elle existe, et c'est invisible dans un compteur de visites.
    suivre('foyer_rejoint')
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
    // `null` = lecture refusée (voir lib/sync.ts). On ne l'applique pas :
    // écraser la liste locale avec un état vide décocherait tout à
    // l'écran, et la prochaine case cochée publierait ce vide.
    void lireListe(foyer).then((distant) => distant && appliquer(distant))
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
      try {
        const existantes = await lireRecettes(foyer)
        setRecipes(existantes.length > 0 ? existantes : await semerCorpusInitial(foyer, CORPUS))
      } catch (e) {
        // Lecture ou semis refusé (policy, réseau) : on affiche le
        // corpus embarqué au build plutôt qu'un catalogue vide. L'app
        // reste entièrement utilisable — proposer, panier, liste,
        // cuisson — et rien n'est écrit dans le foyer tant que la
        // lecture ne repasse pas.
        console.warn(`Catalogue du foyer indisponible, corpus embarqué affiché : ${e}`)
        setRecipes(CORPUS)
      }
    })()
    return suivreRecettes(foyer, setRecipes)
  }, [foyer])

  /**
   * `/#/r/<id>` ouvre directement une fiche. C'est le lien que portent
   * les pages prérendues du catalogue (`scripts/prerender.mjs`) : sans
   * lui, quelqu'un qui arrive sur « Mapo tofu » depuis un moteur de
   * recherche atterrissait dans l'app sur la grille entière, à
   * rechercher le plat qu'il venait de lire.
   *
   * On passe par `irVers` plutôt que par la pile initiale pour que
   * l'entrée d'historique existe — le bouton retour doit ramener au
   * catalogue, pas sortir de l'app. D'où l'attente du catalogue chargé,
   * puis le nettoyage du fragment : un rechargement ne doit pas
   * rouvrir la fiche par-dessus l'écran où on en était.
   */
  const detailOuvertDepuisUrl = useRef(false)
  useEffect(() => {
    if (detailOuvertDepuisUrl.current || recipes.length === 0) return
    const recipeId = location.hash.match(/^#\/r\/([a-z0-9-]+)$/i)?.[1]
    if (!recipeId) return
    detailOuvertDepuisUrl.current = true
    history.replaceState(history.state, '', location.pathname + location.search)
    if (recipes.some((r) => r.id === recipeId)) irVers({ type: 'detail', recipeId })
  }, [recipes, irVers])

  /**
   * L'écran courant, envoyé à la main. Rybbit découpe ses statistiques
   * par adresse, et l'app n'en a qu'une : sans ça, « Proposer » et
   * « Liste » sont le même `/`, et on ne peut pas savoir où les gens
   * s'arrêtent. On a délibérément écarté l'autre solution — faire
   * changer l'URL au fil des écrans — pour garder des liens propres.
   */
  const ecranCourant: Ecran | null = !foyerCharge
    ? null
    : !foyer
      ? 'bienvenue'
      : vueActuelle.type === 'onglet'
        ? // L'onglet « cuisson » liste les plats à cuisiner ; l'écran
          // `cuisson` est le pas-à-pas. Deux moments très différents du
          // parcours, qu'un même nom rendrait illisibles.
          vueActuelle.onglet === 'cuisson'
          ? 'cuisson-liste'
          : vueActuelle.onglet
        : vueActuelle.type

  useEffect(() => {
    if (ecranCourant) suivre('ecran', { nom: ecranCourant })
  }, [ecranCourant])

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

  const rejoindreMinuteur = useCallback(
    (recipeId: string) => {
      setPanneauMinuteurs(false)
      // Déjà sur ce plat : refermer suffit, empiler un second écran de
      // cuisson du même plat n'apporterait qu'un « précédent » de plus.
      if (vueActuelle.type === 'cuisson' && vueActuelle.recipeId === recipeId) return
      irVers({ type: 'cuisson', recipeId })
    },
    [vueActuelle, irVers],
  )

  const majListe = useCallback(
    (suivant: ListState) => {
      setEtatListe(suivant)
      if (foyer) void ecrireListe(foyer, suivant)
    },
    [foyer],
  )

  const majBasket = useCallback(
    (suivant: BasketEntry[]) => {
      // Le panier change par un tableau entier — ajout, retrait et
      // changement de parts passent tous par ici. L'ajout se déduit
      // donc par différence : c'est la première intention réelle de
      // la semaine, et le seul de ces trois gestes qui l'exprime.
      for (const e of suivant) {
        if (!basket.some((b) => b.recipeId === e.recipeId)) {
          suivre('panier_ajout', { recette: e.recipeId })
        }
      }
      majListe({ ...etatListe, panier: suivant })
    },
    [basket, etatListe, majListe],
  )

  /**
   * Vider le panier vide aussi la liste : ce sont les deux faces de la
   * même décision de foyer (« on mange ça » → « il faut acheter ça ») : ils repartent
   * de zéro ensemble, en une seule écriture réseau. Les cases cochées
   * comptent autant que le panier — leur clé est le nom de
   * l'ingrédient, stable d'une semaine à l'autre, donc les garder
   * ferait démarrer la liste suivante à moitié cochée.
   *
   * `panier: []` explicite plutôt que `ETAT_VIDE` : l'application d'un
   * état distant garde le panier local quand le champ est absent (une
   * ligne `listes` d'avant le partage du panier), donc un panier
   * simplement omis ne se viderait pas sur l'autre téléphone.
   */
  const viderPanier = useCallback(
    () => majListe({ coche: {}, dejaPossede: {}, items: [], panier: [] }),
    [majListe],
  )

  const ajouter = useCallback(
    async (recette: Recipe) => {
      if (!foyer) throw new Error(t('app.foyerNonInitialiseReessayez'))
      await ajouterRecette(foyer, recette)
      setRecipes((prec) => [...prec, recette])
    },
    [foyer],
  )

  const modifier = useCallback(
    async (recette: Recipe) => {
      if (!foyer) throw new Error(t('app.foyerNonInitialise'))
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
      // Le verdict ne se donne qu'après la dernière étape : c'est le
      // seul endroit qui prouve qu'un plat a été cuisiné jusqu'au bout,
      // et pas seulement ouvert.
      suivre('cuisson_terminee', {
        recette: recipeId,
        etapes: recipes.find((r) => r.id === recipeId)?.etapes.length ?? 0,
        verdict: v,
      })
      const suivant = await marquerCuisine(recipeId, v)
      setHistorique(suivant)
      if (foyer) void ecrireHistoriqueFoyer(foyer, suivant)
    },
    [foyer, recipes],
  )

  // `recipes` compte autant que `basket` : le catalogue arrive après coup
  // (lecture Supabase, puis temps réel). Sans lui dans les dépendances, la
  // liste reste celle calculée sur un catalogue vide au premier rendu.
  const items = useMemo(() => buildList(basket, recipes), [basket, recipes])

  if (!foyerCharge) return null

  if (!foyer) {
    return <Bienvenue onCreer={creer} onRejoindre={rejoindre} />
  }

  const panneau = panneauMinuteurs && minuteurs.liste.length > 0 && (
    <PanneauMinuteurs
      liste={minuteurs.liste}
      maintenant={minuteurs.maintenant}
      onFermer={() => setPanneauMinuteurs(false)}
      onRetirer={minuteurs.retirer}
      onToutRetirer={() => {
        minuteurs.toutRetirer()
        setPanneauMinuteurs(false)
      }}
      onRejoindre={rejoindreMinuteur}
    />
  )

  if (vueActuelle.type === 'cuisson') {
    const recette = recipes.find((r) => r.id === vueActuelle.recipeId)
    if (recette) {
      // Les doses suivent les parts retenues dans le panier, pas celles
      // écrites au catalogue — sinon la liste de courses et le mode
      // cuisson racontent deux quantités différentes pour le même plat.
      const portionsCible = basket.find((e) => e.recipeId === recette.id)?.portions ?? recette.portions
      return (
        <>
          <Cuisson
            recette={redimensionnerRecette(recette, portionsCible)}
            minuteurs={minuteurs}
            onOuvrirMinuteurs={() => setPanneauMinuteurs(true)}
            onVerdict={async (v) => {
              await verdict(recette.id, v)
              reculer()
            }}
            onQuitter={reculer}
          />
          {panneau}
        </>
      )
    }
  }

  const onglet = vueActuelle.type === 'onglet' ? vueActuelle.onglet : 'propose'
  const estOnglet = vueActuelle.type === 'onglet'

  // Écrans plein page (détail, ajout/édition, réglages) : sur mobile ils
  // restent immersifs comme avant (le CSS masque le rail en dessous de
  // 900px via `data-sous-ecran`), mais sur desktop le rail d'onglets et
  // les repères globaux (réglages, hors ligne) sont le squelette
  // permanent de l'appli — les perdre en ouvrant « Ajouter une recette »
  // se lisait comme un plantage plutôt qu'une navigation normale.
  let ecranPleinePage: React.ReactNode = null
  if (vueActuelle.type === 'edition') {
    const { recette } = vueActuelle
    ecranPleinePage = (
      <ModifierRecette
        recette={recette}
        titresExistants={recipes.map((r) => r.titre)}
        tagsConnus={tousLesTags(recipes)}
        onEnregistrer={modifier}
        onQuitter={reculer}
      />
    )
  } else if (vueActuelle.type === 'detail') {
    const recette = recipes.find((r) => r.id === vueActuelle.recipeId)
    if (recette) {
      ecranPleinePage = (
        <DetailRecette
          recette={recette}
          portions={basket.find((e) => e.recipeId === recette.id)?.portions ?? recette.portions}
          dansPanier={basket.some((e) => e.recipeId === recette.id)}
          onBasculerPanier={(portions) =>
            majBasket(
              basket.some((e) => e.recipeId === recette.id)
                ? basket.filter((e) => e.recipeId !== recette.id)
                : [...basket, { recipeId: recette.id, portions }],
            )
          }
          onPortions={(portions) =>
            majBasket(basket.map((e) => (e.recipeId === recette.id ? { ...e, portions } : e)))
          }
          onCuisiner={() => irVers({ type: 'cuisson', recipeId: recette.id })}
          onModifier={() => irVers({ type: 'edition', recette })}
          onSupprimer={() => supprimer(recette.id)}
          onFermer={reculer}
        />
      )
    }
  } else if (vueActuelle.type === 'reglages') {
    ecranPleinePage = (
      <Reglages
        magasins={magasins.config}
        onMagasins={magasins.definir}
        codeFoyer={codeFoyer}
        onRejoindre={rejoindreDepuisReglages}
        onQuitter={quitter}
        onFermer={reculer}
        onRevoirPresentation={revoirOnboarding}
      />
    )
  }

  const sousEcran = ecranPleinePage !== null

  return (
    <div
      data-sous-ecran={sousEcran ? 'true' : undefined}
      data-minuteur={minuteurs.liste.length > 0 ? 'true' : undefined}
    >
      {vueActuelle.type !== 'reglages' && (
        <button
          className="bouton-rond-discret bouton-reglages-global"
          onClick={() => irVers({ type: 'reglages' })}
          aria-label={t('app.reglages')}
          data-tour="reglages"
        >
          <Icone nom="menu" taille={20} />
        </button>
      )}

      {!enLigne && (
        <p className="pastille-hors-ligne" role="status">
          <Icone nom="alerte" taille={16} /> {t('app.horsLigne')}
        </p>
      )}

      {ecranPleinePage ?? (
        <>
          {onglet === 'propose' && (
            <Propose
              recipes={recipes}
              historique={historique}
              basket={basket}
              onBasket={majBasket}
              onDetail={(recipeId) => irVers({ type: 'detail', recipeId })}
              onAjouterRecette={ajouter}
              ajoutOuvert={ajoutOuvert}
              onAjoutOuvert={setAjoutOuvert}
            />
          )}

          {onglet === 'panier' && (
            <Panier
              recipes={recipes}
              basket={basket}
              historique={historique}
              onBasket={majBasket}
              onVersPropose={() => changerOnglet('propose')}
              onVersListe={() => changerOnglet('liste')}
              onAjouterRecette={ouvrirAjout}
              onViderPanier={viderPanier}
            />
          )}

          {onglet === 'liste' && (
            <Liste
              items={items}
              etat={etatListe}
              onEtat={majListe}
              // Le premier plat qui reste à faire, pas le premier du
              // panier : une fois le curry cuisiné lundi, l'annoncer
              // encore mercredi comme « prochaine cuisson » est faux.
              prochaineCuisson={
                basket
                  .map((e) => recipes.find((r) => r.id === e.recipeId))
                  .find((r): r is Recipe => !!r && !cuisineRecemment(historique, r.id)) ?? null
              }
              magasins={magasins.config}
              onVersCuisson={() => changerOnglet('cuisson')}
              onVersReglages={() => irVers({ type: 'reglages' })}
            />
          )}

          {onglet === 'cuisson' && (
            <CuissonListe
              recipes={recipes}
              basket={basket}
              historique={historique}
              onCuisiner={(recipeId) => irVers({ type: 'cuisson', recipeId })}
            />
          )}
        </>
      )}

      {/* Hors mode cuisson : le minuteur reste sous les yeux, au-dessus
          de la barre d'onglets. Les boutons flottants des écrans lui
          cèdent la place (voir `[data-minuteur]` dans styles.css). */}
      <BandeauMinuteur
        liste={minuteurs.liste}
        maintenant={minuteurs.maintenant}
        sonne={minuteurs.sonnent.length > 0}
        onOuvrir={() => setPanneauMinuteurs(true)}
        variante="global"
      />

      {panneau}

      <nav className="onglets">
        {(
          [
            ['propose', 'etoile', t('app.proposer')],
            ['panier', 'panier', basket.length ? t('app.panier', { n: basket.length }) : t('panier.titre')],
            ['liste', 'liste', t('app.liste')],
            ['cuisson', 'grill', t('app.cuisson')],
          ] as const
        ).map(([cle, icone, label]) => (
          <button
            key={cle}
            data-tour={`nav-${cle}`}
            onClick={() => changerOnglet(cle)}
            aria-current={estOnglet && onglet === cle ? 'page' : undefined}
          >
            <Icone nom={icone} taille={22} />
            {label}
          </button>
        ))}
      </nav>

      {!onboardingVu && estOnglet && (
        <TourGuide ongletActuel={onglet} onOnglet={forcerOnglet} onTerminer={terminerOnboarding} />
      )}
    </div>
  )
}

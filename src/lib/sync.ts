import { createClient, type RealtimeChannel } from '@supabase/supabase-js'
import type { ListState, Recipe } from '../types'
import { traduire } from './i18n'
import type { Historique } from './propose'
import { signalerSynchroOk, signalerSynchroRefusee } from './etatSynchro'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = url && key ? createClient(url, key) : null

/**
 * Le partage entre appareils demande un projet Supabase. Sans lui, l'app
 * marche entièrement — catalogue, panier, liste, cuisson — mais seule sur
 * cet appareil. L'écran d'accueil a besoin de le savoir : jusqu'ici, saisir
 * un code répondait « code introuvable », ce qui envoyait chercher une
 * faute de frappe alors que le problème est ailleurs.
 */
export const partageActif = supabase !== null

/**
 * Session anonyme : invisible pour l'utilisateur — pas de compte, rien à
 * saisir — mais indispensable depuis que les policies raisonnent sur une
 * appartenance (`membres`) plutôt que sur un `using (true)` qui n'appliquait
 * rien. Sans session, `auth.uid()` est nul et la base refuse tout, ce qui est
 * le comportement voulu.
 *
 * Une seule promesse partagée : cinquante appels au démarrage ne doivent pas
 * ouvrir cinquante sessions.
 */
let sessionEnCours: Promise<boolean> | null = null

export function assurerSession(): Promise<boolean> {
  if (!supabase) return Promise.resolve(false)
  sessionEnCours ??= (async () => {
    const { data } = await supabase.auth.getSession()
    if (data.session) return true

    const { error } = await supabase.auth.signInAnonymously()
    if (!error) return true

    // Réessayable au prochain appel plutôt que bloqué à vie sur une coupure
    // réseau passagère.
    sessionEnCours = null
    console.warn(`Session anonyme impossible : ${error.message}`)
    // Hors ligne, c'est normal et le bandeau dédié le dit déjà. En ligne,
    // c'est une panne de configuration (connexions anonymes désactivées dans
    // le tableau de bord) qui ne se réglera pas toute seule.
    if (navigator.onLine) {
      signalerSynchroRefusee('session', `Connexion anonyme refusée : ${error.message}`)
    }
    return false
  })()
  return sessionEnCours
}

/**
 * Session *et* appartenance au foyer, mémorisées par foyer.
 *
 * Toutes les fonctions ci-dessous passent par ici, et c'est délibéré : depuis
 * que les policies raisonnent sur `membres`, une requête envoyée avant que
 * l'appartenance existe ne renvoie rien — sans erreur, juste zéro ligne.
 * Faire réclamer le foyer par l'écran d'accueil aurait marché la plupart du
 * temps et échoué à la moindre course entre effets React. Ici, l'ordre ne
 * peut plus être faux.
 *
 * `reclamer_foyer` est rappelé à chaque démarrage : Supabase fait le ménage
 * des utilisateurs anonymes inactifs, et l'appartenance s'en va avec eux.
 * L'appareil connaît toujours son UUID, donc la session suivante la rétablit
 * sans que personne ne le voie.
 */
const accesParFoyer = new Map<string, Promise<boolean>>()

export function assurerAcces(foyer: string): Promise<boolean> {
  if (!supabase) return Promise.resolve(false)

  let acces = accesParFoyer.get(foyer)
  if (!acces) {
    acces = (async () => {
      if (!(await assurerSession())) return false
      const { error } = await supabase!.rpc('reclamer_foyer', { uuid_foyer: foyer })
      if (error) {
        accesParFoyer.delete(foyer)
        console.warn(`Accès au foyer refusé : ${error.message}`)
        signalerSynchroRefusee('acces', `Accès au foyer refusé : ${error.message}`)
        return false
      }
      return true
    })()
    accesParFoyer.set(foyer, acces)
  }
  return acces
}

/**
 * Créer un foyer ou le rejoindre par code inscrit déjà l'appareil : inutile
 * de repasser par `reclamer_foyer` juste après.
 */
export function marquerAccesObtenu(foyer: string): void {
  accesParFoyer.set(foyer, Promise.resolve(true))
}

/**
 * Ouvre un canal temps réel une fois l'accès obtenu, et rend de quoi le
 * refermer tout de suite. L'attente est le point important : Realtime évalue
 * la RLS avec le jeton de la connexion, et un abonnement ouvert avant la
 * session serait celui d'un anonyme sans droits — il resterait muet pour
 * toujours, sans erreur.
 */
function abonner(
  foyer: string,
  construire: (client: NonNullable<typeof supabase>) => RealtimeChannel,
): () => void {
  if (!supabase) return () => {}
  const client = supabase
  let canal: RealtimeChannel | null = null
  let annule = false

  void assurerAcces(foyer).then((pret) => {
    if (!pret || annule) return
    canal = construire(client)
  })

  return () => {
    annule = true
    if (canal) void client.removeChannel(canal)
  }
}

const VIDE: ListState = { coche: {}, dejaPossede: {} }

/**
 * Sans ça, un abonnement qui échoue (table absente de la publication
 * `supabase_realtime`, policy manquante, réseau coupé) ne dit rien du
 * tout : l'app a l'air de marcher, elle ne reçoit simplement jamais
 * rien. On ignore CLOSED, qui est le statut normal au démontage.
 *
 * Signalé comme `tempsReel` et pas comme un refus d'écriture : ce qui est
 * coché ici part quand même, et l'autre téléphone le verra — à sa
 * prochaine lecture plutôt qu'en direct. Le remède n'est pas dans les
 * policies mais dans Database → Replication.
 */
const journaliserStatut = (nom: string) => (statut: string) => {
  if (statut === 'CHANNEL_ERROR' || statut === 'TIMED_OUT') {
    console.warn(`Realtime « ${nom} » : ${statut} — les mises à jour vives ne remonteront pas.`)
    signalerSynchroRefusee('tempsReel', `Realtime « ${nom} » : ${statut}`)
  } else if (statut === 'SUBSCRIBED') {
    console.info(`Realtime « ${nom} » : abonné.`)
  }
}

/**
 * Un topic ne peut être joint qu'une fois par connexion. StrictMode
 * monte, démonte et remonte chaque effet en dev : le second abonnement
 * réclamerait un topic que le premier n'a pas encore fini de libérer
 * (removeChannel est asynchrone), et il meurt sans bruit. Un suffixe
 * unique par abonnement rend la collision impossible — le topic ne sert
 * qu'à nommer le canal, le filtrage réel se fait dans `filter`.
 */
const topic = (prefixe: string) => `${prefixe}:${crypto.randomUUID().slice(0, 8)}`

/**
 * La seule donnée synchronisée : l'état de la liste du foyer.
 * Une ligne, un JSON, dernier écrivain gagne. Deux personnes qui
 * cochent des produits différents ne se marchent pas dessus ;
 * deux personnes qui cochent le même en même temps arrivent au
 * même résultat. Ça suffit pour des courses.
 *
 * `null` quand la lecture a échoué, et c'est tout l'intérêt : une
 * erreur retournait `VIDE`, exactement comme un foyer qui n'a encore
 * rien publié. L'appelant appliquait donc un état vide par-dessus le
 * sien, décochant la liste à l'écran — puis la première case recochée
 * réécrivait ce vide dans Supabase. Un foyer sans ligne, lui, rend
 * bien `VIDE` : c'est une réponse, pas une panne.
 */
export async function lireListe(foyer: string): Promise<ListState | null> {
  if (!supabase || !(await assurerAcces(foyer))) return VIDE
  const { data, error } = await supabase
    .from('listes')
    .select('etat')
    .eq('foyer', foyer)
    .maybeSingle()
  if (error) {
    console.warn(`Lecture de la liste refusée : ${error.message}`)
    return null
  }
  return (data?.etat as ListState) ?? VIDE
}

/**
 * L'échec n'interrompt pas l'utilisateur : cocher un produit en rayon
 * ne doit jamais ouvrir une alerte, et la copie locale fait foi le
 * temps que le réseau revienne (l'écran affiche déjà le bandeau « hors
 * ligne »). Mais il est journalisé — sans ça, une policy mal réglée
 * ressemble à une app qui marche et ne synchronise simplement jamais.
 */
export async function ecrireListe(foyer: string, etat: ListState): Promise<void> {
  if (!supabase || !(await assurerAcces(foyer))) return
  const { error } = await supabase.from('listes').upsert({ foyer, etat, maj: new Date().toISOString() })
  if (error) {
    console.warn(`Écriture de la liste refusée : ${error.message}`)
    signalerSynchroRefusee('ecriture', error.message)
  } else signalerSynchroOk()
}

export function suivreListe(foyer: string, onChange: (etat: ListState) => void): () => void {
  return abonner(foyer, (client) =>
    client
      .channel(topic(`liste:${foyer}`))
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'listes', filter: `foyer=eq.${foyer}` },
        (payload) => {
          const etat = (payload.new as { etat?: ListState })?.etat
          if (etat) onChange(etat)
        },
      )
      .subscribe(journaliserStatut('liste'))
,
  )
}

/**
 * Le catalogue du foyer. Vide si Supabase n'est pas configuré —
 * à l'appelant de retomber sur le corpus de départ dans ce cas
 * (voir semerCorpusInitial et App.tsx).
 *
 * Lève si la lecture échoue plutôt que de rendre une liste vide : un
 * `select` refusé (policy mal réglée) ressemblait trait pour trait à
 * un foyer tout neuf, et l'appelant enchaînait sur le semis — c'est
 * l'intégralité du corpus réinséré à chaque ouverture, en double, dès
 * lors que l'`insert`, lui, passait.
 */
export async function lireRecettes(foyer: string): Promise<Recipe[]> {
  if (!supabase || !(await assurerAcces(foyer))) return []
  const { data, error } = await supabase.from('recettes').select('recette').eq('foyer', foyer)
  if (error) throw new Error(`Lecture du catalogue refusée : ${error.message}`)
  return (data ?? []).map((ligne) => ligne.recette as Recipe)
}

export async function ajouterRecette(foyer: string, recette: Recipe): Promise<void> {
  if (!supabase) throw new Error(traduire('sync.partageNonConfigureAjout'))
  await assurerAcces(foyer)
  // Le résultat était ignoré : un insert refusé (policy, réseau coupé
  // au mauvais moment) laissait l'app annoncer « Recette ajoutée » et
  // l'afficher dans le catalogue, jusqu'au rechargement où elle avait
  // disparu. Une écriture qui échoue doit se dire.
  const { error } = await supabase.from('recettes').insert({ foyer, recette })
  if (error) throw new Error(error.message)
}

export async function modifierRecette(foyer: string, recette: Recipe): Promise<void> {
  if (!supabase) throw new Error(traduire('sync.partageNonConfigureModification'))
  await assurerAcces(foyer)
  const { error } = await supabase
    .from('recettes')
    .update({ recette })
    .eq('foyer', foyer)
    .eq('recette->>id', recette.id)
  if (error) throw new Error(error.message)
}

export async function supprimerRecette(foyer: string, recipeId: string): Promise<void> {
  if (!supabase) throw new Error(traduire('sync.partageNonConfigureSuppression'))
  await assurerAcces(foyer)
  const { error } = await supabase
    .from('recettes')
    .delete()
    .eq('foyer', foyer)
    .eq('recette->>id', recipeId)
  if (error) throw new Error(error.message)
}

/**
 * Peuple un foyer tout neuf avec le corpus de départ (src/data/recipes.json).
 * On garde les ids d'origine (« mapo-tofu », etc.) : l'historique local
 * (marquerCuisine) y fait référence, les changer casserait le lien.
 * N'écrit rien si le foyer a déjà des recettes — pas de doublon au
 * rechargement.
 */
export async function semerCorpusInitial(foyer: string, corpus: Recipe[]): Promise<Recipe[]> {
  if (!supabase || !(await assurerAcces(foyer))) return []
  const { count, error: erreurCompte } = await supabase
    .from('recettes')
    .select('id', { count: 'exact', head: true })
    .eq('foyer', foyer)
  if (erreurCompte) throw new Error(`Lecture du catalogue refusée : ${erreurCompte.message}`)
  // Déjà semé entre-temps — l'autre téléphone du foyer a été plus
  // rapide. On relit ce qu'il a écrit au lieu de rendre `[]`, qui
  // s'affichait comme un catalogue vide jusqu'au rechargement suivant.
  if (count && count > 0) return lireRecettes(foyer)

  const { error } = await supabase.from('recettes').insert(corpus.map((recette) => ({ foyer, recette })))
  if (error) throw new Error(`Échec du seed initial : ${error.message}`)
  return corpus
}

/**
 * Suit le catalogue du foyer : ajout, modification et suppression.
 * On relit tout le catalogue à chaque changement plutôt que de
 * patcher l'état pièce par pièce — un DELETE ne transporte que la
 * clé primaire de la ligne, pas l'id de recette, donc le patch
 * ciblé demanderait REPLICA IDENTITY FULL côté base. Quelques
 * dizaines de recettes se relisent en une requête.
 */
/**
 * L'historique de cuisson est un fait du foyer, pas de l'appareil :
 * « on a mangé ça mardi » vaut pour les deux téléphones.
 */
export async function lireHistoriqueFoyer(foyer: string): Promise<Historique | null> {
  if (!supabase || !(await assurerAcces(foyer))) return null
  const { data, error } = await supabase
    .from('historiques')
    .select('historique')
    .eq('foyer', foyer)
    .maybeSingle()
  if (error) {
    console.warn(`Lecture de l'historique refusée : ${error.message}`)
    return null
  }
  return (data?.historique as Historique) ?? null
}

export async function ecrireHistoriqueFoyer(foyer: string, historique: Historique): Promise<void> {
  if (!supabase || !(await assurerAcces(foyer))) return
  const { error } = await supabase
    .from('historiques')
    .upsert({ foyer, historique, maj: new Date().toISOString() })
  if (error) {
    console.warn(`Écriture de l'historique refusée : ${error.message}`)
    signalerSynchroRefusee('ecriture', error.message)
  } else signalerSynchroOk()
}

export function suivreHistorique(foyer: string, onChange: (h: Historique) => void): () => void {
  return abonner(foyer, (client) =>
    client
      .channel(topic(`historique:${foyer}`))
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'historiques', filter: `foyer=eq.${foyer}` },
        (payload) => {
          const h = (payload.new as { historique?: Historique })?.historique
          if (h) onChange(h)
        },
      )
      .subscribe(journaliserStatut('historique'))
,
  )
}

export function suivreRecettes(foyer: string, onChangement: (recettes: Recipe[]) => void): () => void {
  return abonner(foyer, (client) =>
    client
      .channel(topic(`recettes:${foyer}`))
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'recettes', filter: `foyer=eq.${foyer}` },
        // `lireRecettes` lève désormais sur lecture refusée : sans ce
        // `catch`, chaque notification temps réel produirait un rejet non
        // rattrapé. On garde le catalogue déjà à l'écran.
        () =>
          void lireRecettes(foyer)
            .then(onChangement)
            .catch((e: unknown) => console.warn(`Relecture du catalogue impossible : ${e}`)),
      )
      .subscribe(journaliserStatut('recettes'))
,
  )
}

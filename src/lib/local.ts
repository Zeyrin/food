import { del, get, set } from 'idb-keyval'
import type { BasketEntry, Verdict } from '../types'
import type { ConfigMagasins } from './magasins'
import { CONFIG_PAR_DEFAUT, normaliserConfig } from './magasins'
import type { Historique } from './propose'

/**
 * Tout ce qui est personnel vit ici, hors ligne, sans compte.
 * Seule la liste de courses part sur le réseau (voir sync.ts).
 */

const K_BASKET = 'basket'
const K_HISTORIQUE = 'historique'
const K_FOYER = 'foyer'
const K_CODE_FOYER = 'codeFoyer'
const K_MAGASINS = 'magasins'
const K_FOYER_PRECEDENT = 'foyerPrecedent'

const HISTORIQUE_VIDE: Historique = { derniereFois: {}, verdicts: {} }

/**
 * IndexedDB n'est pas toujours là. Navigation privée stricte, cookies
 * tiers coupés, WebView verrouillée, quota atteint : `get` et `set`
 * rejettent, et rien dans idb-keyval ne le rattrape. L'amorçage de
 * l'app (App.tsx) est une suite d'`await` sur ces fonctions — une
 * seule qui rejette laissait `foyerCharge` à `false` pour toujours,
 * c'est-à-dire un écran blanc définitif, pour un stockage dont l'app
 * peut très bien se passer le temps d'une session.
 *
 * On rend donc l'absence de stockage indistinguable d'un stockage
 * vide : l'app démarre, elle oublie simplement d'une fois sur l'autre.
 * Journalisé une seule fois — répéter l'avertissement à chaque lecture
 * noierait la console sans rien apprendre de plus.
 */
let stockageSignale = false

function signalerStockage(e: unknown): void {
  if (stockageSignale) return
  stockageSignale = true
  console.warn(
    `Stockage local indisponible : l'app fonctionne, mais ne se souviendra de rien au prochain lancement. (${e})`,
  )
}

async function lire<T>(cle: string, defaut: T): Promise<T> {
  try {
    return (await get<T>(cle)) ?? defaut
  } catch (e) {
    signalerStockage(e)
    return defaut
  }
}

async function ecrire(cle: string, valeur: unknown): Promise<void> {
  try {
    await set(cle, valeur)
  } catch (e) {
    signalerStockage(e)
  }
}

async function effacer(cle: string): Promise<void> {
  try {
    await del(cle)
  } catch (e) {
    signalerStockage(e)
  }
}

export async function lireBasket(): Promise<BasketEntry[]> {
  return lire<BasketEntry[]>(K_BASKET, [])
}

export async function ecrireBasket(basket: BasketEntry[]): Promise<void> {
  await ecrire(K_BASKET, basket)
}

export async function lireHistorique(): Promise<Historique> {
  return lire<Historique>(K_HISTORIQUE, HISTORIQUE_VIDE)
}

export async function marquerCuisine(recipeId: string, verdict: Verdict): Promise<Historique> {
  const h = await lireHistorique()
  const suivant: Historique = {
    derniereFois: { ...h.derniereFois, [recipeId]: Date.now() },
    verdicts: { ...h.verdicts, [recipeId]: verdict },
  }
  await ecrire(K_HISTORIQUE, suivant)
  return suivant
}

/**
 * Les magasins restent sur l'appareil, alors que la liste voyage : ce
 * n'est pas une décision de foyer mais la façon dont *celui qui va
 * faire les courses* range son parcours. Deux téléphones d'un même
 * foyer peuvent légitimement ne pas passer aux mêmes endroits, et une
 * config qui se synchronise obligerait à trancher — pour un réglage
 * qui ne change rien à ce qu'il y a à acheter.
 */
export async function lireMagasins(): Promise<ConfigMagasins> {
  return normaliserConfig(await lire<ConfigMagasins>(K_MAGASINS, CONFIG_PAR_DEFAUT))
}

export async function ecrireMagasins(config: ConfigMagasins): Promise<void> {
  await ecrire(K_MAGASINS, config)
}

/**
 * L'identifiant du foyer est le secret de partage. Il arrive par
 * l'URL (#/f/<uuid>), ou a déjà été choisi sur cet appareil ; sinon
 * `null` — à l'appelant de proposer explicitement d'en créer un ou
 * d'en rejoindre un par code (voir écran Bienvenue), plutôt que
 * d'en générer un en douce à chaque nouvel appareil.
 *
 * Le lien prime même si l'enregistrement échoue : sans stockage, on
 * ouvre quand même le foyer qu'on vient de nous partager.
 */
export async function lireFoyer(): Promise<string | null> {
  const depuisUrl = location.hash.match(/\/f\/([0-9a-f-]{36})/i)?.[1]
  if (depuisUrl) {
    await ecrire(K_FOYER, depuisUrl)
    return depuisUrl
  }
  return lire<string | null>(K_FOYER, null)
}

export async function rejoindreFoyer(id: string, code?: string): Promise<void> {
  await ecrire(K_FOYER, id)
  if (code) await ecrire(K_CODE_FOYER, code)
  // On est revenu là d'où on était parti : il n'y a plus de retour en
  // arrière à proposer sur l'écran d'accueil.
  const precedent = await lireFoyerPrecedent()
  if (precedent?.id === id) await oublierFoyerPrecedent()
}

export async function lireCodeFoyer(): Promise<string | null> {
  return lire<string | null>(K_CODE_FOYER, null)
}

/**
 * La maison qu'on vient de quitter, gardée sur l'appareil pour pouvoir y
 * revenir d'un geste.
 *
 * Quitter un foyer ne le supprime pas et ne révoque rien — l'écran
 * Réglages le dit déjà : « vos recettes et votre liste actuelles
 * resteront accessibles avec leur propre code ». Retrouver ce code
 * demandait pourtant d'aller le lire sur l'autre téléphone. On note donc
 * ici de quoi rentrer, et l'écran d'accueil le propose — avec de quoi
 * l'oublier, parce que passer le téléphone à quelqu'un est aussi une
 * raison de quitter une maison.
 */
export interface FoyerPrecedent {
  id: string
  /** `null` pour un foyer ouvert par lien : son code n'a jamais transité ici. */
  code: string | null
  quitteLe: number
}

export async function lireFoyerPrecedent(): Promise<FoyerPrecedent | null> {
  return lire<FoyerPrecedent | null>(K_FOYER_PRECEDENT, null)
}

export async function oublierFoyerPrecedent(): Promise<void> {
  await effacer(K_FOYER_PRECEDENT)
}

export async function quitterFoyer(): Promise<void> {
  // Noter où l'on était avant d'effacer, et pas après : les deux `effacer`
  // qui suivent rendraient la lecture vide.
  const id = await lire<string | null>(K_FOYER, null)
  if (id) {
    const code = await lire<string | null>(K_CODE_FOYER, null)
    await ecrire(K_FOYER_PRECEDENT, { id, code, quitteLe: Date.now() } satisfies FoyerPrecedent)
  }
  await effacer(K_FOYER)
  await effacer(K_CODE_FOYER)
}

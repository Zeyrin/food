import { del, get, set } from 'idb-keyval'
import type { BasketEntry, Verdict } from '../types'
import type { Historique } from './propose'

/**
 * Tout ce qui est personnel vit ici, hors ligne, sans compte.
 * Seule la liste de courses part sur le réseau (voir sync.ts).
 */

const K_BASKET = 'basket'
const K_HISTORIQUE = 'historique'
const K_FOYER = 'foyer'
const K_CODE_FOYER = 'codeFoyer'

const HISTORIQUE_VIDE: Historique = { derniereFois: {}, verdicts: {} }

export async function lireBasket(): Promise<BasketEntry[]> {
  return (await get<BasketEntry[]>(K_BASKET)) ?? []
}

export async function ecrireBasket(basket: BasketEntry[]): Promise<void> {
  await set(K_BASKET, basket)
}

export async function lireHistorique(): Promise<Historique> {
  return (await get<Historique>(K_HISTORIQUE)) ?? HISTORIQUE_VIDE
}

export async function marquerCuisine(recipeId: string, verdict: Verdict): Promise<Historique> {
  const h = await lireHistorique()
  const suivant: Historique = {
    derniereFois: { ...h.derniereFois, [recipeId]: Date.now() },
    verdicts: { ...h.verdicts, [recipeId]: verdict },
  }
  await set(K_HISTORIQUE, suivant)
  return suivant
}

/**
 * L'identifiant du foyer est le secret de partage. Il arrive par
 * l'URL (#/f/<uuid>), ou a déjà été choisi sur cet appareil ; sinon
 * `null` — à l'appelant de proposer explicitement d'en créer un ou
 * d'en rejoindre un par code (voir écran Bienvenue), plutôt que
 * d'en générer un en douce à chaque nouvel appareil.
 */
export async function lireFoyer(): Promise<string | null> {
  const depuisUrl = location.hash.match(/\/f\/([0-9a-f-]{36})/i)?.[1]
  if (depuisUrl) {
    await set(K_FOYER, depuisUrl)
    return depuisUrl
  }
  return (await get<string>(K_FOYER)) ?? null
}

export async function rejoindreFoyer(id: string, code?: string): Promise<void> {
  await set(K_FOYER, id)
  if (code) await set(K_CODE_FOYER, code)
}

export async function lireCodeFoyer(): Promise<string | null> {
  return (await get<string>(K_CODE_FOYER)) ?? null
}

export async function quitterFoyer(): Promise<void> {
  await del(K_FOYER)
  await del(K_CODE_FOYER)
}

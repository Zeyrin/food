import { get, set } from 'idb-keyval'
import type { BasketEntry, Verdict } from '../types'
import type { Historique } from './propose'

/**
 * Tout ce qui est personnel vit ici, hors ligne, sans compte.
 * Seule la liste de courses part sur le réseau (voir sync.ts).
 */

const K_BASKET = 'basket'
const K_HISTORIQUE = 'historique'
const K_FOYER = 'foyer'

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
 * L'identifiant du foyer est le secret de partage : il arrive par
 * l'URL (#/f/<uuid>) la première fois, puis on le garde. Qui a le
 * lien a la liste — c'est tout le modèle d'accès.
 */
export async function lireFoyer(): Promise<string | null> {
  const depuisUrl = location.hash.match(/\/f\/([0-9a-f-]{36})/i)?.[1]
  if (depuisUrl) {
    await set(K_FOYER, depuisUrl)
    return depuisUrl
  }
  return (await get<string>(K_FOYER)) ?? null
}

export async function creerFoyer(): Promise<string> {
  const id = crypto.randomUUID()
  await set(K_FOYER, id)
  return id
}

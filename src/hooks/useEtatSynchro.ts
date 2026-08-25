import { useSyncExternalStore } from 'react'
import {
  abonnerSynchro,
  lireCauseSynchro,
  lireEtatSynchro,
  lireMotifSynchro,
  type CauseSynchro,
  type EtatSynchro,
} from '../lib/etatSynchro'

/**
 * `useSyncExternalStore` plutôt qu'un `useEffect` + `useState` : le
 * refus peut tomber avant que le composant ne soit monté (première
 * écriture au démarrage), et cette API lit la valeur courante au premier
 * rendu au lieu de la manquer.
 */
export function useEtatSynchro(): {
  etat: EtatSynchro
  cause: CauseSynchro | null
  motif: string | null
} {
  const etat = useSyncExternalStore(abonnerSynchro, lireEtatSynchro, () => 'inconnu' as const)
  const cause = useSyncExternalStore(abonnerSynchro, lireCauseSynchro, () => null)
  const motif = useSyncExternalStore(abonnerSynchro, lireMotifSynchro, () => null)
  return { etat, cause, motif }
}

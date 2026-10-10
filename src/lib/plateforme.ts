/**
 * Navigateur ou app des stores (Capacitor) ? Isolé de `natif.ts` pour
 * que les modules testés sous Node n'embarquent pas les plugins natifs.
 */
import { Capacitor } from '@capacitor/core'

export const NATIF = Capacitor.isNativePlatform()

/** L'adresse publique, celle qu'un lien partagé depuis l'app doit porter. */
export const ORIGINE_PUBLIQUE = 'https://www.fffood.fr'

/** L'origine à mettre dans un lien qui sort de l'appareil. */
export function originePartage(): string {
  return NATIF ? ORIGINE_PUBLIQUE : location.origin
}

/** Une page statique du site (crédits, données) : en ligne depuis l'app. */
export function pageSite(chemin: string): string {
  return NATIF ? ORIGINE_PUBLIQUE + chemin : chemin
}

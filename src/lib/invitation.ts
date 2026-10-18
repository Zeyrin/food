/**
 * Le lien qu'on envoie pour faire entrer quelqu'un dans sa maison, et la
 * signature qui accompagne une liste de courses envoyée par SMS.
 *
 * Le lien de maison existait déjà (`#/f/<uuid>`), mais seul le bandeau des
 * vues web d'Instagram ou TikTok le donnait : partager la maison voulait
 * dire dicter six caractères. Il porte maintenant, en option, le prénom de
 * celui qui invite (`#/f/<uuid>?de=Camille`) : arriver dans « la maison de
 * Camille » dit tout de suite où l'on est, là où une maison anonyme
 * ressemble à une erreur.
 *
 * Tout reste dans le fragment : ni le serveur ni les robots d'aperçu ne le
 * reçoivent, le secret de la maison et le prénom ne sortent pas de la
 * conversation où le lien a été collé. Le chemin `/rejoindre/`, lui, est vu
 * des robots : c'est la page prérendue qui donne au lien son propre aperçu
 * (voir `scripts/prerender.mjs`).
 *
 * Fonctions pures, testées.
 */
import { ORIGINE_PUBLIQUE, originePartage } from './plateforme'

export interface Invitation {
  foyer: string
  /** Le prénom de qui invite, `null` quand le lien n'en porte pas. */
  de: string | null
}

/** Le prénom du profil fait au plus trente caractères (voir `Profil`). */
const LONGUEUR_PRENOM = 30

/** Même tolérance que `lireFoyer` : c'est le format que la base a toujours rendu. */
const FRAGMENT = /^#\/f\/([0-9a-f-]{36})(?:\?(.*))?$/i

export function lireInvitation(hash: string): Invitation | null {
  const [, foyer, requete] = hash.match(FRAGMENT) ?? []
  if (!foyer) return null
  const de = new URLSearchParams(requete ?? '').get('de')?.trim().slice(0, LONGUEUR_PRENOM) || null
  return { foyer: foyer.toLowerCase(), de }
}

export function lienInvitation(foyer: string, prenom: string, origine: string = originePartage()): string {
  const de = prenom.trim().slice(0, LONGUEUR_PRENOM)
  return `${origine}/rejoindre/#/f/${foyer}${de ? `?de=${encodeURIComponent(de)}` : ''}`
}

/**
 * L'adresse au bas d'une liste envoyée. Toujours le site public, même
 * depuis l'app des stores : c'est quelqu'un qui n'a pas FFFood qui la lit.
 * Le marqueur UTM laisse compter, dans Rybbit, les visites venues d'une
 * liste reçue.
 */
export const LIEN_SIGNATURE = `${ORIGINE_PUBLIQUE}/?utm_source=liste&utm_medium=partage`

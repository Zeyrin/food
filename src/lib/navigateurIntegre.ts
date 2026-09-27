/**
 * Le navigateur intégré d'une app sociale, s'il y en a un.
 *
 * Un lien touché dans Instagram ou TikTok ne s'ouvre pas dans Safari ou
 * Chrome mais dans une vue web de l'app elle-même, qui garde son propre
 * stockage. La maison créée là n'existe donc plus quand la même personne
 * rouvre FFFood dans son vrai navigateur : elle retombe sur l'accueil, et
 * croit que l'app a tout perdu. On ne peut pas sortir de cette vue à sa
 * place — on peut la reconnaître, et le dire au bon moment.
 *
 * Reconnue à l'agent utilisateur, que ces apps signent toutes. Une
 * inconnue répond `null` : on ne dérange personne sur une supposition.
 */
const SIGNATURES: readonly [RegExp, string][] = [
  [/Instagram/i, 'Instagram'],
  [/BytedanceWebview|musical_ly|TikTok|ByteLocale/i, 'TikTok'],
  [/FBAN|FBAV|FB_IAB|FBIOS/i, 'Facebook'],
  [/Snapchat/i, 'Snapchat'],
  [/Pinterest/i, 'Pinterest'],
  [/LinkedInApp/i, 'LinkedIn'],
  [/\bLine\//i, 'LINE'],
]

export function navigateurIntegre(ua: string = typeof navigator === 'undefined' ? '' : navigator.userAgent): string | null {
  for (const [motif, nom] of SIGNATURES) if (motif.test(ua)) return nom
  return null
}

/** L'adresse qui rouvre cette maison ailleurs : le lien de partage du foyer. */
export function lienMaison(foyer: string): string {
  return `${location.origin}/#/f/${foyer}`
}

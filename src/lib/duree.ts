import { traduire } from './i18n'

/**
 * Minuteurs proposés par une étape. On lit la recette au lieu de
 * demander un champ de plus dans le JSON : la durée y est déjà écrite,
 * la retaper ailleurs serait une occasion de la contredire.
 *
 * Le mot d'unité est obligatoire, sinon « préchauffer à 200 °C » et
 * « des cubes de 2 cm » deviendraient des minuteurs.
 */
const DUREE = /(\d+)\s*(h\b|heures?|hours?|min\b|minutes?|secondes?|seconds?|sec\b)/gi

/** Amorces de proposition : elles n'apportent rien à un nom de minuteur.
 *  Les deux langues, puisque le nom du minuteur est découpé dans
 *  l'étape telle qu'elle est affichée. */
const AMORCE = /^(?:puis|et|ensuite|alors|enfin|then|and|next|finally)\s+/i

export interface Minuteur {
  secondes: number
  /** « Faire dorer les lardons » — pour reconnaître le minuteur d'un
   *  coup d'œil quand trois tournent en même temps. */
  nom: string
}

/** « 1200 » → « 20 min ». Pour les libellés, pas pour le décompte. */
export function formatDuree(secondes: number): string {
  if (secondes >= 3600) return `${secondes / 3600} h`
  if (secondes >= 60) return `${secondes / 60} min`
  return `${secondes} s`
}

/**
 * Nomme un minuteur avec ce que l'étape demande de faire juste avant
 * d'annoncer sa durée : dans « Faire dorer les lardons à sec 4 min »,
 * tout ce qui précède « 4 min ».
 */
function nommer(texte: string, jusqua: number, secondes: number): string {
  // On borne d'abord à la phrase en cours : « … et miso. Remuer 1 min »
  // ne doit pas donner « Miso, Remuer ». Cette phrase est ensuite
  // découpée à la virgule, où commence le plus souvent la proposition
  // qui porte la durée.
  const phrase = texte
    .slice(0, jusqua)
    .replace(/[{}]/g, '') // les marqueurs d'ingrédient ne sont pas du texte
    .split(/[.;:—–]/)
    .pop()

  const morceaux = (phrase ?? '')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)

  let nom = morceaux[morceaux.length - 1] ?? ''

  // « Ajouter les pois chiches égouttés, laisser 5 min » : « laisser »
  // tout seul ne dit rien, on reprend le morceau d'avant avec lui.
  const precedent = morceaux[morceaux.length - 2]
  if (nom.length < 12 && precedent) nom = `${precedent}, ${nom}`

  nom = nom.replace(AMORCE, '').trim()
  if (!nom) return ''
  if (nom.length > 46) nom = nom.slice(0, 45).replace(/\s+\S*$/, '') + '…'

  // « Laisser », « Remuer » : la phrase n'offre rien de plus pour les
  // distinguer l'un de l'autre, la durée s'en charge.
  if (nom.length < 12) nom = `${nom} ${formatDuree(secondes)}`

  return nom.charAt(0).toUpperCase() + nom.slice(1)
}

export function minuteursDeLEtape(texte: string): Minuteur[] {
  // Une durée citée deux fois dans la même étape ne donne qu'un bouton,
  // et c'est sa première mention qui la nomme.
  const vus = new Map<number, string>()

  for (const m of texte.matchAll(DUREE)) {
    const n = Number(m[1])
    const unite = m[2]!.toLowerCase()
    const secondes = unite.startsWith('h') ? n * 3600 : unite.startsWith('s') ? n : n * 60
    if (secondes > 0 && !vus.has(secondes)) {
      vus.set(
        secondes,
        nommer(texte, m.index ?? 0, secondes) ||
          traduire('duree.minuteurSansNom', { duree: formatDuree(secondes) }),
      )
    }
  }

  return [...vus]
    .map(([secondes, nom]) => ({ secondes, nom }))
    .sort((a, b) => a.secondes - b.secondes)
}

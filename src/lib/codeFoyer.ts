/**
 * Ce qu'on accepte dans le champ « rejoindre » de l'écran d'accueil.
 *
 * Un code de foyer circule par SMS, par mail, ou lu à voix haute d'un
 * téléphone à l'autre. Il arrive donc rarement nu : avec le lien qui
 * l'entoure, avec des espaces, en minuscules, ou collé depuis une
 * conversation. Le champ n'a aucune raison de refuser tout ça pour
 * exiger six majuscules tapées à la main.
 *
 * Deux formes valent une entrée dans un foyer, et ce sont les deux
 * seules que la base reconnaît (voir `supabase/migration-01-appartenance.sql`) :
 * le code court, résolu par `rejoindre_foyer`, et l'UUID du foyer, réclamé
 * par `reclamer_foyer`. Un lien de partage porte le second dans son
 * fragment (`#/f/<uuid>`) — le coller doit donc marcher, plutôt que de
 * laisser l'utilisateur y pêcher un code qui n'y est pas.
 *
 * Fonction pure, testée : c'est le seul endroit qui décide ce qu'est une
 * saisie valide, et l'écran comme le champ s'y réfèrent.
 */

/** Le code fait six caractères, tirés de l'alphabet de `creer_foyer`. */
export const LONGUEUR_CODE = 6

/**
 * L'UUID tel que Postgres l'écrit. Volontairement strict : `[0-9a-f-]{36}`
 * accepterait trente-six tirets, et on s'en sert ici pour décider d'un
 * appel réseau, pas pour un simple affichage.
 */
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i

/** Ce qui trahit un lien plutôt qu'un code mal recopié. */
const LIEN = /:\/\/|#\/|\bwww\./i

export type SaisieFoyer =
  /** Six caractères : bon à envoyer à `rejoindre_foyer`. */
  | { type: 'code'; code: string }
  /** Un UUID trouvé dans le texte : bon à envoyer à `reclamer_foyer`. */
  | { type: 'lien'; foyer: string }
  /** Moins de six caractères : on continue de taper, rien à signaler. */
  | { type: 'partiel'; code: string }
  /** Ça ressemblait à un lien, mais il n'y avait pas de foyer dedans. */
  | { type: 'lienSansFoyer' }

/**
 * L'ordre compte : l'UUID est cherché avant le filtrage en majuscules,
 * sans quoi `a1b2…` d'un lien serait réduit à ses six premiers
 * caractères alphanumériques et envoyé comme un code.
 */
export function analyserSaisieFoyer(brut: string): SaisieFoyer {
  const texte = brut.trim()

  const uuid = texte.match(UUID)?.[0]
  if (uuid) return { type: 'lien', foyer: uuid.toLowerCase() }

  // Un lien sans UUID ne devient pas un code par découpage : « https://
  // fffood… » donnerait « HTTPSF », six caractères parfaitement valides
  // en apparence, et un « code introuvable » qui n'explique rien.
  if (LIEN.test(texte)) return { type: 'lienSansFoyer' }

  const code = texte.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, LONGUEUR_CODE)
  return code.length === LONGUEUR_CODE ? { type: 'code', code } : { type: 'partiel', code }
}

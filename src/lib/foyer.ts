import { assurerSession, marquerAccesObtenu, supabase } from './sync'

/**
 * Créer un foyer, en rejoindre un, ou réclamer celui qu'on connaît déjà.
 *
 * Ces trois gestes passaient par des requêtes directes sur la table
 * `foyers`, dont la policy `for select using (true)` laissait en réalité
 * n'importe qui lire *tous* les couples (uuid, code) du service — soit le
 * passe-partout de tous les foyers, dans un bundle dont la clé anon est
 * publique par construction.
 *
 * Ils passent maintenant par trois fonctions `security definer` : la table
 * n'est plus lisible du tout, et chacune exige de présenter le code exact
 * ou l'UUID exact. Le modèle annoncé — « qui a le lien a la liste » —
 * devient enfin celui qui est appliqué. Voir
 * `supabase/migration-01-appartenance.sql`.
 */

/** Repli hors ligne : un code lisible, pour que l'app reste utilisable seule. */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

function codeLocal(): string {
  let code = ''
  for (let i = 0; i < 6; i++) code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  return code
}

export async function creerFoyerAvecCode(): Promise<{ id: string; code: string }> {
  // Sans Supabase configuré, l'app tourne en solo sur cet appareil : le
  // foyer existe localement, son code ne mènera nulle part tant qu'un
  // projet n'est pas branché — c'est déjà le comportement d'avant.
  if (!supabase) return { id: crypto.randomUUID(), code: codeLocal() }

  await assurerSession()
  const { data, error } = await supabase.rpc('creer_foyer')
  if (error) throw new Error(error.message)

  const resultat = data as { foyer?: string; code?: string } | null
  if (!resultat?.foyer || !resultat.code) {
    throw new Error("La maison n'a pas pu être créée.")
  }
  // `creer_foyer` a déjà inscrit l'appareil : pas de `reclamer_foyer`
  // redondant au premier chargement.
  marquerAccesObtenu(resultat.foyer)
  return { id: resultat.foyer, code: resultat.code }
}

/**
 * Résout un code court et inscrit l'appareil dans le foyer correspondant.
 * `null` quand le code n'existe pas — la fonction ne dit jamais rien des
 * codes voisins, et compte les essais côté base.
 */
export async function resoudreCode(code: string): Promise<string | null> {
  if (!supabase) return null
  await assurerSession()
  const { data, error } = await supabase.rpc('rejoindre_foyer', { code_saisi: code.trim().toUpperCase() })
  if (error) throw new Error(error.message)

  const id = (data as string | null) ?? null
  if (id) marquerAccesObtenu(id)
  return id
}

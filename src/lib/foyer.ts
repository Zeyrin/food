import { assurerSession, marquerAccesObtenu, supabase } from './sync'
import { traduire } from './i18n'

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

  // Le booléen était ignoré : sans session, l'appel partait quand même en
  // tant qu'`anon` — à qui la migration a justement révoqué le droit
  // d'exécuter ces fonctions. L'utilisateur lisait « la maison n'a pas pu
  // être créée » là où la vraie cause est un réglage du tableau de bord.
  if (!(await assurerSession())) throw new Error(traduire('foyer.sessionImpossible'))

  const { data, error } = await supabase.rpc('creer_foyer')
  if (error) throw new Error(error.message)

  const resultat = data as { foyer?: string; code?: string } | null
  if (!resultat?.foyer || !resultat.code) {
    throw new Error(traduire('foyer.creationEchouee'))
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
  if (!(await assurerSession())) throw new Error(traduire('foyer.sessionImpossible'))
  const { data, error } = await supabase.rpc('rejoindre_foyer', { code_saisi: code.trim().toUpperCase() })
  if (error) throw new Error(error.message)

  const id = (data as string | null) ?? null
  if (id) marquerAccesObtenu(id)
  return id
}

/**
 * Réclamer un foyer dont on connaît l'UUID — le second chemin d'entrée
 * prévu par la base, à côté du code court. C'est ce que fait un lien de
 * partage collé dans l'écran d'accueil, et c'est aussi comment on rentre
 * dans une maison qu'on avait quittée sans en avoir gardé le code.
 *
 * `reclamer_foyer` ne lève pas quand le foyer n'existe pas : elle rend
 * `false`. `assurerAcces` ignore ce retour — elle ne regarde que l'erreur,
 * ce qui lui suffit puisqu'elle travaille sur un foyer déjà connu. Ici
 * l'UUID vient d'être collé par quelqu'un : il faut donc lire la réponse,
 * sinon un lien inventé ouvrirait une maison vide sans rien dire.
 */
export async function reclamerFoyer(id: string): Promise<boolean> {
  // Sans Supabase, le foyer n'a jamais existé ailleurs que sur cet
  // appareil : le reprendre est une écriture locale et rien d'autre.
  // L'entrée par lien, elle, est barrée en amont (`partageActif`) —
  // sinon n'importe quel UUID ouvrirait ici une maison vide.
  if (!supabase) return true

  await assurerSession()
  const { data, error } = await supabase.rpc('reclamer_foyer', { uuid_foyer: id })
  if (error) throw new Error(error.message)
  if (data !== true) return false

  marquerAccesObtenu(id)
  return true
}

/**
 * Revenir dans la maison qu'on venait de quitter. Par le code quand on
 * l'a gardé — c'est le chemin normal, et il rend l'UUID à jour même si
 * celui noté ici avait vieilli ; par l'UUID sinon, ce qui est le cas d'un
 * foyer ouvert par lien, dont le code n'a jamais transité par l'appareil.
 */
export async function reprendreFoyer(precedent: { id: string; code: string | null }): Promise<string | null> {
  if (supabase && precedent.code) {
    const id = await resoudreCode(precedent.code)
    if (id) return id
  }
  return (await reclamerFoyer(precedent.id)) ? precedent.id : null
}

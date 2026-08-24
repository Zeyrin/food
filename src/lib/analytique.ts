/**
 * Ce qu'on mesure, et le seul endroit d'où on le mesure.
 *
 * Rybbit compte les visites tout seul, mais l'app tient dans une seule
 * adresse : ses quatre écrans, ses 137 fiches et son mode cuisson sont
 * indistinguables d'un simple `/`. On savait donc que des gens
 * venaient, jamais s'ils arrivaient jusqu'à la liste de courses.
 *
 * Les événements comblent ça sans toucher à l'URL — décision assumée :
 * l'adresse reste `fffood.fr`, on ne la transforme pas en fil
 * d'Ariane. Le compteur de pages, lui, continue de tourner comme avant,
 * pour que les chiffres restent comparables d'un mois sur l'autre.
 *
 * **Ce qui ne sort jamais d'ici.** L'identifiant de foyer et son code
 * court sont le secret de partage (README, « le partage se fait par
 * lien ») : les envoyer à un service tiers reviendrait à publier la
 * clé de la liste. Le texte libre non plus — un item tapé à la main
 * dit ce qu'on achète, ce qui ne regarde personne. Restent des
 * identifiants de recettes, qui sont publics, et des compteurs.
 *
 * `Evenements` est la liste complète : un nom qui n'y figure pas ne
 * compile pas. Sans ça, une faute de frappe crée un événement fantôme
 * qu'on ne remarque qu'en cherchant, des semaines plus tard, pourquoi
 * la courbe est plate.
 */

/** Les écrans, tels qu'ils apparaîtront dans le tableau de bord. */
export type Ecran =
  | 'bienvenue'
  | 'propose'
  | 'panier'
  | 'liste'
  | 'cuisson-liste'
  | 'detail'
  | 'cuisson'
  | 'edition'
  | 'reglages'

/**
 * Un événement par moment qui apprend quelque chose sur le parcours,
 * et rien de plus. Pas de tic de minuteur ni de frappe au clavier :
 * ces volumes-là se facturent et n'expliquent rien.
 */
export interface Evenements {
  /** Remplace le découpage par page, que l'URL unique rend impossible. */
  ecran: { nom: Ecran }
  /** Première intention réelle : ce plat-là, cette semaine. */
  panier_ajout: { recette: string }
  /** La dernière case cochée — les courses ont vraiment été faites. */
  liste_terminee: { lignes: number }
  /** Allé au bout des étapes, et dit ce qu'il en pensait. */
  cuisson_terminee: { recette: string; etapes: number; verdict: string }
  /** Le catalogue grandit : c'est le second métier de l'app. */
  recette_ajoutee: { via: 'formulaire' | 'collage'; lot: number }
  /** Un foyer neuf. */
  foyer_cree: undefined
  /** Un second téléphone rejoint : l'app fait ce pour quoi elle existe. */
  foyer_rejoint: undefined
  /** Installée à l'écran d'accueil, donc utilisable en magasin. */
  installation_pwa: undefined
  /** Lancé depuis le mode cuisson. */
  minuteur_lance: { minutes: number }
}

interface Rybbit {
  event: (nom: string, props?: Record<string, string | number>) => void
  error: (message: string, props?: Record<string, string | number>) => void
}

/**
 * Le script peut manquer : bloqueur de publicité, réseau coupé,
 * `npm run dev` sans la balise. La mesure est alors silencieuse — elle
 * n'a jamais le droit de faire tomber un écran de cuisson.
 */
const rybbit = (): Rybbit | null =>
  (window as Window & { rybbit?: Rybbit }).rybbit ?? null

type Args<N extends keyof Evenements> = Evenements[N] extends undefined
  ? [N]
  : [N, Evenements[N]]

export function suivre<N extends keyof Evenements>(...args: Args<N>): void {
  const [nom, props] = args as [N, Record<string, string | number> | undefined]
  try {
    rybbit()?.event(nom, props)
  } catch {
    /* la mesure ne casse pas l'app : voir plus haut */
  }
}

/**
 * Un rendu qui s'interrompt (`LimiteErreur`) laissait l'utilisateur
 * devant un écran de repli et nous devant rien du tout. On envoie le
 * message, jamais la pile : elle contient des chemins de fichiers et
 * ne se lit pas dans un tableau de bord de toute façon.
 */
export function suivreErreur(message: string): void {
  try {
    rybbit()?.error(message.slice(0, 200))
  } catch {
    /* idem */
  }
}

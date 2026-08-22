import type { ListItem, RayonId } from '../types'
import { RAYONS_ORDONNES } from '../types'

/**
 * Un magasin, tel que l'utilisateur le nomme. Rien d'imposé : ni
 * enseigne codée en dur, ni liste à choisir — « Lidl », « le marché du
 * samedi » ou « en bas de chez moi » sont des réponses également
 * valables.
 */
export interface Magasin {
  id: string
  nom: string
}

/**
 * Où le foyer achète quoi. Un seul magasin par défaut : c'est le cas
 * de la plupart des gens, et la liste se range alors par rayon, dans
 * l'ordre où on traverse le magasin. Ceux qui prennent leurs légumes
 * ailleurs ajoutent un second magasin et lui affectent des rayons —
 * la liste se coupe en deux, une section par arrêt.
 */
export interface ConfigMagasins {
  /** Dans l'ordre où on les fait. */
  magasins: Magasin[]
  /** rayon → id de magasin. Un rayon absent va au premier magasin. */
  routage: Partial<Record<RayonId, string>>
}

export const MAGASIN_PRINCIPAL = 'principal'

/**
 * Le nom du magasin par défaut est vide, pas « Mon magasin » : tant
 * qu'il n'y en a qu'un, l'écran de courses ne l'affiche pas du tout —
 * personne n'a besoin qu'on lui rappelle où il est. Le nom ne devient
 * une information qu'à partir du deuxième.
 */
export const CONFIG_PAR_DEFAUT: ConfigMagasins = {
  magasins: [{ id: MAGASIN_PRINCIPAL, nom: '' }],
  routage: {},
}

/**
 * Une config relue du stockage peut dater d'une version antérieure, ou
 * avoir perdu un magasin auquel un rayon renvoie encore. On la remet
 * d'aplomb au lieu de faire disparaître des lignes de la liste.
 */
export function normaliserConfig(config: ConfigMagasins | null | undefined): ConfigMagasins {
  const magasins = (config?.magasins ?? []).filter((m) => m && typeof m.id === 'string')
  if (magasins.length === 0) return CONFIG_PAR_DEFAUT

  const connus = new Set(magasins.map((m) => m.id))
  const routage: ConfigMagasins['routage'] = {}
  for (const [rayon, id] of Object.entries(config?.routage ?? {})) {
    if (connus.has(id as string)) routage[rayon as RayonId] = id as string
  }
  return { magasins, routage }
}

/** Le magasin où se prend un rayon. À défaut, le premier de la liste. */
export function magasinDuRayon(rayon: RayonId, config: ConfigMagasins): Magasin {
  const id = config.routage[rayon]
  return config.magasins.find((m) => m.id === id) ?? config.magasins[0]!
}

export interface GroupeRayon {
  rayon: RayonId
  items: ListItem[]
}

export interface GroupeMagasin {
  magasin: Magasin
  rayons: GroupeRayon[]
}

/**
 * La liste telle qu'on la parcourt : un arrêt après l'autre, et dans
 * chaque arrêt les rayons dans l'ordre. Les magasins où il n'y a rien
 * à prendre cette semaine ne s'affichent pas — un intitulé suivi du
 * vide ferait croire à un oubli.
 */
export function grouperPourCourses(items: ListItem[], config: ConfigMagasins): GroupeMagasin[] {
  const parMagasin = new Map<string, GroupeRayon[]>()

  for (const rayon of RAYONS_ORDONNES) {
    const lignes = items.filter((i) => i.rayon === rayon)
    if (lignes.length === 0) continue
    const magasin = magasinDuRayon(rayon, config)
    const groupes = parMagasin.get(magasin.id) ?? []
    groupes.push({ rayon, items: lignes })
    parMagasin.set(magasin.id, groupes)
  }

  return config.magasins
    .map((magasin) => ({ magasin, rayons: parMagasin.get(magasin.id) ?? [] }))
    .filter((g) => g.rayons.length > 0)
}

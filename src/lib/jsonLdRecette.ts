/**
 * Lire une recette dans une page web. Presque tous les sites de cuisine
 * (Marmiton, 750g, Cuisine AZ, Ricardo, Jamie Oliver…) publient leur
 * recette en JSON-LD schema.org/Recipe pour Google : c'est le seul format
 * assez stable pour qu'un import par lien marche sans règle par site.
 *
 * Ce module ne dépend de rien (ni React, ni DOM) : il tourne dans la
 * fonction serveur `api/importer-recette.ts` qui télécharge la page, et
 * dans les tests sous Node.
 */

/** Ce qu'on tire de la page, avant toute interprétation des ingrédients. */
export interface RecetteWeb {
  titre: string
  description?: string
  /** Minutes ; 0 si la page ne le dit pas. */
  temps: number
  /** Nombre de parts ; 0 si la page ne le dit pas. */
  portions: number
  /** Lignes d'ingrédients telles qu'écrites : « 200 g de farine ». */
  ingredients: string[]
  etapes: string[]
  tags: string[]
}

const ENTITES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  rsquo: '’',
  lsquo: '‘',
  hellip: '…',
  deg: '°',
  eacute: 'é',
  egrave: 'è',
  agrave: 'à',
  ccedil: 'ç',
}

/** Du HTML qui s'est glissé dans un champ texte → du texte lisible. */
export function nettoyerTexte(brut: string): string {
  return brut
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, nom: string) => ENTITES[nom.toLowerCase()] ?? m)
    .replace(/[ \t ]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim()
}

/** « PT1H30M » → 90. Renvoie 0 pour tout ce qui n'est pas une durée ISO 8601. */
export function dureeIso(valeur: unknown): number {
  if (typeof valeur !== 'string') return 0
  const m = valeur.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:\d+S)?)?$/i)
  if (!m) return 0
  return Number(m[1] ?? 0) * 1440 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0)
}

/** « 4 personnes », 4, ["4", "4 parts"] → 4. */
function lirePortions(valeur: unknown): number {
  const premier = Array.isArray(valeur) ? valeur[0] : valeur
  if (typeof premier === 'number') return Number.isFinite(premier) && premier >= 1 ? Math.round(premier) : 0
  if (typeof premier !== 'string') return 0
  const m = premier.match(/\d+/)
  return m ? Number(m[0]) : 0
}

const enTableau = (v: unknown): unknown[] => (Array.isArray(v) ? v : v === undefined || v === null ? [] : [v])

/** Les étapes sont tantôt un texte, tantôt des HowToStep, tantôt des sections de HowToStep. */
function lireEtapes(valeur: unknown): string[] {
  if (typeof valeur === 'string') {
    // Un seul bloc de texte : une étape par ligne, sinon par phrase numérotée.
    return nettoyerTexte(valeur)
      .split(/\n+/)
      .map((l) => l.replace(/^\s*(?:étape\s*)?\d+\s*[.):-]\s*/i, '').trim())
      .filter(Boolean)
  }
  const etapes: string[] = []
  for (const element of enTableau(valeur)) {
    if (typeof element === 'string') {
      etapes.push(...lireEtapes(element))
    } else if (typeof element === 'object' && element !== null) {
      const o = element as Record<string, unknown>
      if (o.itemListElement !== undefined) etapes.push(...lireEtapes(o.itemListElement))
      else if (typeof o.text === 'string') etapes.push(...lireEtapes(o.text))
      else if (typeof o.name === 'string') etapes.push(...lireEtapes(o.name))
    }
  }
  return etapes
}

function lireTags(r: Record<string, unknown>): string[] {
  const brut = [r.recipeCategory, r.recipeCuisine, r.keywords].flatMap((v) =>
    enTableau(v).flatMap((x) => (typeof x === 'string' ? x.split(',') : [])),
  )
  const vus = new Set<string>()
  for (const t of brut) {
    const propre = nettoyerTexte(t).toLowerCase()
    if (propre && propre.length <= 24) vus.add(propre)
  }
  return [...vus].slice(0, 6)
}

const estRecette = (n: unknown): n is Record<string, unknown> => {
  if (typeof n !== 'object' || n === null) return false
  const type = (n as Record<string, unknown>)['@type']
  return enTableau(type).some((t) => typeof t === 'string' && /(^|[/#])Recipe$/i.test(t))
}

/** Cherche un nœud Recipe dans n'importe quelle forme de JSON-LD (@graph, tableaux, imbrication). */
function trouverRecette(noeud: unknown, profondeur = 0): Record<string, unknown> | null {
  if (profondeur > 6 || typeof noeud !== 'object' || noeud === null) return null
  if (estRecette(noeud)) return noeud
  const valeurs = Array.isArray(noeud) ? noeud : Object.values(noeud)
  for (const v of valeurs) {
    const trouve = trouverRecette(v, profondeur + 1)
    if (trouve) return trouve
  }
  return null
}

/**
 * La recette d'une page HTML, ou `null` si elle n'en publie pas au format
 * schema.org. `null` est une réponse normale (blog sans balisage, page
 * d'accueil d'un site) : l'appelant le dit à l'utilisateur.
 */
export function extraireRecetteJsonLd(html: string): RecetteWeb | null {
  const blocs = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
  for (const [, contenu] of blocs) {
    let json: unknown
    try {
      json = JSON.parse((contenu ?? '').trim())
    } catch {
      continue
    }
    const r = trouverRecette(json)
    if (!r) continue

    const titre = typeof r.name === 'string' ? nettoyerTexte(r.name) : ''
    const ingredients = enTableau(r.recipeIngredient ?? r.ingredients)
      .filter((x): x is string => typeof x === 'string')
      .map((x) => nettoyerTexte(x))
      .filter(Boolean)
    const etapes = lireEtapes(r.recipeInstructions)
    if (!titre || ingredients.length === 0 || etapes.length === 0) continue

    const total = dureeIso(r.totalTime)
    const temps = total > 0 ? total : dureeIso(r.prepTime) + dureeIso(r.cookTime)

    return {
      titre,
      ...(typeof r.description === 'string' && r.description.trim()
        ? { description: nettoyerTexte(r.description).slice(0, 220) }
        : {}),
      temps,
      portions: lirePortions(r.recipeYield),
      ingredients,
      etapes,
      tags: lireTags(r),
    }
  }
  return null
}

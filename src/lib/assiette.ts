import type { RecipeIngredient } from '../types'

/**
 * L'assiette dessinée d'une recette sans photo.
 *
 * Cent recettes du corpus n'ont pas de photo, et l'aplat pastel qui les
 * remplaçait faisait de la grille un nuancier : sur une capture d'écran,
 * rien ne disait qu'on regardait des plats. On dessine donc une assiette
 * vue du dessus, garnie de ce que la recette contient vraiment — une base
 * (riz, pâtes, sauce), des morceaux, des grains, des feuilles — dans les
 * couleurs des ingrédients.
 *
 * Tout est dérivé du titre et de la liste d'ingrédients, jamais du hasard :
 * une recette garde exactement la même assiette d'un lancement et d'un
 * téléphone à l'autre, comme elle garde sa teinte (`identite.ts`).
 */

export type Forme = 'base' | 'morceaux' | 'grains' | 'tranches' | 'feuilles' | 'oeuf'

interface Garniture {
  forme: Forme
  couleur: string
  /** Le grain d'une base : des filaments pour les pâtes, des grains pour le riz. */
  texture?: 'nouilles' | 'riz'
}

/**
 * Premier motif qui correspond gagne : les plus précis passent avant
 * les plus larges (« lait de coco » avant « lait », « oignon rouge »
 * avant « oignon »). Ce qui n'est pas listé ne se dessine pas — un
 * condiment de plus sur l'assiette ne dirait rien du plat.
 */
const TABLE: readonly [RegExp, Forme, string][] = [
  // Ce qui ne se voit pas dans l'assiette.
  [/^(sel|poivre|sucre|farine|levure|fécule|bouillon|extrait|muscade|cannelle|cumin|curcuma|paprika|garam|épices|coriandre moulue|herbes de provence|bouquet garni|baies|piment d'espelette|vin |vinaigre|huile|sauce|pâte de tamarin|pâte miso|doubanjiang|lao ganma|galanga|citronnelle|feuilles de combava|ail|échalote|gingembre|moutarde|mayonnaise|ketchup|miel|eau|cacao|chapelure|poivre du sichuan|piment séché)/, 'base', ''],

  [/lait de coco|pâte de curry jaune|curry massaman/, 'base', '#f3dca4'],
  [/pâte de curry vert/, 'base', '#b9cf7a'],
  [/pâte de curry/, 'base', '#e0873f'],
  [/lentilles corail|potimarron|patate douce|courge|butternut/, 'base', '#eb9a45'],
  [/tomates concassées|concentré de tomate|coulis|sauce tomate/, 'base', '#d2513a'],
  [/riz|semoule|quinoa|boulgour|polenta/, 'base', '#f6eed8'],
  [/pâtes courtes|pâtes à lasagne|gnocchi/, 'base', '#efd48c'],
  [/pâtes|nouilles|spaghetti|vermicelles|tagliatelle/, 'base', '#f1d68e'],
  [/pomme de terre|purée/, 'base', '#ecd08a'],
  [/crème|fromage blanc|yaourt|lait|béchamel|hummus|tahini/, 'base', '#f7f0e0'],
  [/choucroute|chou chinois/, 'base', '#e6e2b0'],
  [/lentilles/, 'grains', '#6f6a3a'],

  [/tomate cerise|radis/, 'tranches', '#dc4a3b'],
  [/tomate/, 'tranches', '#d9483b'],
  [/citron vert|combava/, 'tranches', '#9ccc4a'],
  [/citron/, 'tranches', '#f2d24a'],
  [/concombre|courgette/, 'tranches', '#a9cf7e'],
  [/orange|mangue|abricot|pêche/, 'tranches', '#f2a33a'],
  [/banane|pomme|poire/, 'tranches', '#ecd98a'],

  [/petits pois|edamame|pois gourmand/, 'grains', '#7cb342'],
  [/pois chiches|flageolets|haricots blancs/, 'grains', '#dcb66e'],
  [/haricots rouges|cerises/, 'grains', '#8e2f36'],
  [/maïs/, 'grains', '#f1c232'],
  [/cacahuètes|noix|amandes|noisettes|sésame|pignons|raisins secs|câpres|pruneaux/, 'grains', '#c49358'],
  [/olives noires/, 'grains', '#3a2e2c'],
  [/olives vertes/, 'grains', '#8f9c3c'],
  [/crevette/, 'morceaux', '#f4a07a'],

  [/basilic|persil|coriandre|menthe|ciboulette|estragon|aneth|thym|oignon nouveau|roquette/, 'feuilles', '#4f8a2e'],
  [/épinard|kale|salade|pak choï|mâche|endive|algue|pousses/, 'feuilles', '#6e9f3c'],

  [/avocat/, 'morceaux', '#a6c96a'],
  [/brocoli|haricots verts|poireau|céleri branche|asperge|chou/, 'morceaux', '#5f8f35'],
  [/poivron|piment/, 'morceaux', '#d8452f'],
  [/carotte/, 'morceaux', '#ef8a2e'],
  [/aubergine/, 'morceaux', '#5e3a6e'],
  [/champignon/, 'morceaux', '#b48a64'],
  [/oignon rouge/, 'morceaux', '#a4507c'],
  [/oignon|navet|céleri-rave|chou-fleur|cœur de palmier/, 'morceaux', '#f1e7cf'],
  [/saumon|truite/, 'morceaux', '#f39a78'],
  [/cabillaud|poisson|saint-jacques|thon|anchois|moules/, 'morceaux', '#f2ebdd'],
  [/tofu/, 'morceaux', '#f3e8c6'],
  [/poulet|dinde|veau|lapin|porc|canard|jambon blanc/, 'morceaux', '#dfae6d'],
  [/lardons|poitrine|jambon cru|chorizo/, 'morceaux', '#d07a64'],
  [/bœuf|boeuf|steak|agneau|saucisse|boudin|magret|rumsteck|gigot|merguez/, 'morceaux', '#8e4c35'],
  [/comté|parmesan|cheddar|fromage|mozzarella|chèvre|reblochon|camembert|feta/, 'morceaux', '#f6d77a'],
  [/chocolat/, 'morceaux', '#5a3726'],
  [/pain|baguette|tortilla|galette|pâte (brisée|feuilletée|à pizza)|feuilles à gyoza/, 'morceaux', '#dcaa62'],
]

function garnitureDe(nom: string): Garniture | null {
  const n = nom.toLowerCase()
  if (/^(œuf|oeuf)/.test(n)) return { forme: 'oeuf', couleur: '#f5b82e' }
  for (const [motif, forme, couleur] of TABLE) {
    if (!motif.test(n)) continue
    if (!couleur) return null
    if (forme === 'base' && /^(riz|semoule|quinoa|boulgour)/.test(n)) return { forme, couleur, texture: 'riz' }
    if (forme === 'base' && /^(pâtes longues|nouilles|spaghetti|vermicelles|tagliatelle)/.test(n))
      return { forme, couleur, texture: 'nouilles' }
    return { forme, couleur }
  }
  return null
}

/** Générateur déterministe (mulberry32) : même graine, même assiette. */
function aleaDepuis(graine: number): () => number {
  let a = graine >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function graineDe(texte: string): number {
  let h = 2166136261
  for (let i = 0; i < texte.length; i++) {
    h ^= texte.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/**
 * Une forme organique fermée : un cercle dont le rayon ondule, lissé en
 * courbes quadratiques passant par le milieu de chaque segment. Pas de
 * cercle parfait dans l'assiette — c'est ce qui la fait lire comme de
 * la nourriture plutôt que comme un diagramme.
 */
function tache(cx: number, cy: number, r: number, alea: () => number, points = 7, ondulation = 0.22): string {
  const pts: [number, number][] = []
  const depart = alea() * Math.PI * 2
  for (let i = 0; i < points; i++) {
    const a = depart + (i / points) * Math.PI * 2
    const ri = r * (1 - ondulation / 2 + alea() * ondulation)
    pts.push([cx + Math.cos(a) * ri, cy + Math.sin(a) * ri])
  }
  const milieu = (i: number): [number, number] => {
    const p = pts[i % points]!
    const q = pts[(i + 1) % points]!
    return [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]
  }
  const [mx, my] = milieu(points - 1)
  let d = `M${f(mx)} ${f(my)}`
  for (let i = 0; i < points; i++) {
    const [px, py] = pts[i]!
    const [nx, ny] = milieu(i)
    d += `Q${f(px)} ${f(py)} ${f(nx)} ${f(ny)}`
  }
  return d + 'Z'
}

const f = (n: number) => (Math.round(n * 10) / 10).toString()

export type Element =
  | { type: 'chemin'; d: string; couleur: string; opacite?: number }
  | { type: 'rond'; cx: number; cy: number; r: number; couleur: string; opacite?: number }
  | { type: 'feuille'; cx: number; cy: number; l: number; angle: number; couleur: string }
  | { type: 'tranche'; cx: number; cy: number; r: number; couleur: string }
  | { type: 'trait'; d: string; couleur: string; epaisseur: number; opacite?: number }

/**
 * Trois façons de servir, lues dans le titre. Une tarte, une quiche ou
 * une pizza se reconnaissent à leur disque doré bien plus qu'à leurs
 * ingrédients ; une salade à son lit de feuilles. Tout le reste est un
 * plat « à l'assiette » : une base, et ce qu'on pose dessus.
 */
type Service = 'tarte' | 'salade' | 'assiette'

function serviceDe(titre: string, garnitures: Garniture[]): Service {
  const t = titre.toLowerCase()
  if (/tarte|quiche|pizza|flammekueche|clafoutis|galette|tortilla|crumble|gratin|lasagne|cake|gâteau|moelleux|far /.test(t)) return 'tarte'
  if (/salade|bowl|taboulé|poke/.test(t) && garnitures.some((g) => g.forme === 'feuilles')) return 'salade'
  return 'assiette'
}

/** La même tache, un demi-pas plus bas à droite et dans l'ombre : le relief. */
function morceau(elements: Element[], d: string, dOmbre: string, couleur: string): void {
  elements.push({ type: 'chemin', d: dOmbre, couleur: '#201b0c', opacite: 0.16 })
  elements.push({ type: 'chemin', d, couleur })
}

/**
 * Les couches de l'assiette, du fond vers le dessus, dans un repère de
 * 100 × 100 centré sur (50, 50). L'assiette elle-même (le disque et son
 * marli) est dessinée par le composant ; ceci n'est que ce qu'on y sert.
 */
export function composerAssiette(titre: string, ingredients: readonly RecipeIngredient[]): Element[] {
  const alea = aleaDepuis(graineDe(titre))
  const vus = new Set<string>()
  const garnitures: Garniture[] = []
  for (const ing of ingredients) {
    const g = garnitureDe(ing.nom)
    if (!g) continue
    const cle = `${g.forme}${g.couleur}`
    if (vus.has(cle)) continue
    vus.add(cle)
    garnitures.push(g)
  }
  const poivre = ingredients.some((i) => /^poivre/.test(i.nom))

  const elements: Element[] = []
  const service = serviceDe(titre, garnitures)
  const base = garnitures.find((g) => g.forme === 'base')
  const herbes = garnitures.filter((g) => g.forme === 'feuilles')
  const reste = garnitures.filter((g) => g !== base && g.forme !== 'feuilles').slice(0, 4)

  if (service === 'tarte') {
    // Le disque doré, sa bordure plus cuite, puis la garniture — la base
    // de la recette (crème, tomate) si elle en a une, sinon un appareil
    // doré.
    elements.push({ type: 'rond', cx: 51, cy: 51.5, r: 29, couleur: '#201b0c', opacite: 0.14 })
    elements.push({ type: 'chemin', d: tache(50, 50, 29, alea, 14, 0.06), couleur: '#c98b3f' })
    elements.push({ type: 'chemin', d: tache(50, 50, 25, alea, 12, 0.07), couleur: base?.couleur ?? '#efc873' })
    elements.push({ type: 'chemin', d: tache(46, 45, 13, alea, 8, 0.3), couleur: '#ffffff', opacite: 0.14 })
    // Quelques taches de gratiné.
    for (let k = 0; k < 6; k++) {
      const a = alea() * Math.PI * 2
      const d = alea() * 20
      elements.push({
        type: 'chemin',
        d: tache(50 + Math.cos(a) * d, 50 + Math.sin(a) * d, 1.6 + alea() * 2, alea, 5, 0.4),
        couleur: '#b8752e',
        opacite: 0.35,
      })
    }
  } else if (service === 'salade') {
    // Le lit de feuilles couvre le creux : la première herbe verte en fait
    // le fond, en deux tons pour qu'on distingue les feuilles entre elles.
    const lit = herbes[0]!
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2 + alea() * 0.4
      const d = 6 + alea() * 16
      elements.push({
        type: 'feuille',
        cx: 50 + Math.cos(a) * d,
        cy: 50 + Math.sin(a) * d,
        l: 7 + alea() * 3,
        angle: Math.round((a * 180) / Math.PI + (alea() - 0.5) * 50),
        couleur: k % 2 ? lit.couleur : '#8cbf55',
      })
    }
  } else {
    // La base couvre le creux de l'assiette. Sans base reconnue, une
    // sauce dorée — beurre, jus de cuisson — plutôt qu'une faïence à nu,
    // qui laissait une assiette vide sous trois morceaux.
    const couleurBase = base?.couleur ?? '#f0d9a2'
    elements.push({ type: 'chemin', d: tache(50.8, 51.2, base ? 26 : 22, alea, 10, 0.14), couleur: '#201b0c', opacite: 0.1 })
    elements.push({ type: 'chemin', d: tache(50, 50, base ? 26 : 22, alea, 10, 0.14), couleur: couleurBase })
    // Un reflet crémeux, décalé vers le haut-gauche : la lumière tombe
    // de là sur toutes les assiettes, comme sur les badges.
    elements.push({ type: 'chemin', d: tache(44, 44, 12, alea, 7, 0.3), couleur: '#ffffff', opacite: 0.2 })
    if (base?.texture === 'nouilles') {
      // Des filaments en boucles lâches : un nid de pâtes vu du dessus.
      for (let k = 0; k < 16; k++) {
        const a = alea() * Math.PI * 2
        const d = alea() * 17
        const x = 50 + Math.cos(a) * d
        const y = 50 + Math.sin(a) * d
        const r = 5 + alea() * 6
        const a0 = alea() * Math.PI * 2
        const a1 = a0 + 1.6 + alea() * 1.8
        elements.push({
          type: 'trait',
          d: `M${f(x + Math.cos(a0) * r)} ${f(y + Math.sin(a0) * r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + Math.cos(a1) * r)} ${f(y + Math.sin(a1) * r)}`,
          couleur: k % 3 ? '#d9b35c' : '#fff3c8',
          epaisseur: 1.3,
        })
      }
    } else if (base?.texture === 'riz') {
      // Des grains allongés, orientés au hasard, en blanc sur la base.
      for (let k = 0; k < 34; k++) {
        const a = alea() * Math.PI * 2
        const d = Math.sqrt(alea()) * 22
        const x = 50 + Math.cos(a) * d
        const y = 50 + Math.sin(a) * d
        const o = alea() * Math.PI
        elements.push({
          type: 'trait',
          d: `M${f(x - Math.cos(o) * 1.1)} ${f(y - Math.sin(o) * 1.1)}L${f(x + Math.cos(o) * 1.1)} ${f(y + Math.sin(o) * 1.1)}`,
          couleur: k % 4 ? '#ffffff' : '#dccfae',
          epaisseur: 1.3,
        })
      }
    }
  }

  // Positions tirées sur un anneau autour du centre, décalées pour que
  // deux garnitures ne se posent pas au même endroit.
  const angleDepart = alea() * Math.PI * 2
  reste.forEach((g, i) => {
    const angle = angleDepart + (i / Math.max(reste.length, 1)) * Math.PI * 2
    const rayonAnneau = reste.length === 1 ? 4 + alea() * 4 : 10 + alea() * 5
    const cx = 50 + Math.cos(angle) * rayonAnneau
    const cy = 50 + Math.sin(angle) * rayonAnneau

    switch (g.forme) {
      case 'oeuf': {
        const blanc = tache(cx, cy, 10, alea, 8, 0.18)
        morceau(elements, blanc, tache(cx + 0.9, cy + 1.1, 10, aleaDepuis(1), 8, 0.18), '#fffaf0')
        elements.push({ type: 'rond', cx: cx + 0.6, cy: cy - 0.4, r: 4.2, couleur: g.couleur })
        elements.push({ type: 'rond', cx: cx - 0.6, cy: cy - 1.5, r: 1.2, couleur: '#ffffff', opacite: 0.6 })
        break
      }
      case 'morceaux': {
        const n = 4 + Math.floor(alea() * 3)
        for (let k = 0; k < n; k++) {
          const a = alea() * Math.PI * 2
          const d = 1 + alea() * 7
          const x = cx + Math.cos(a) * d
          const y = cy + Math.sin(a) * d
          const r = 3.6 + alea() * 2.6
          const graine = Math.floor(alea() * 1e9)
          morceau(
            elements,
            tache(x, y, r, aleaDepuis(graine), 5, 0.35),
            tache(x + 0.8, y + 1, r, aleaDepuis(graine), 5, 0.35),
            g.couleur,
          )
        }
        break
      }
      case 'tranches': {
        const n = 2 + Math.floor(alea() * 2)
        for (let k = 0; k < n; k++) {
          const a = angle + (k - (n - 1) / 2) * 0.6
          const d = Math.max(rayonAnneau, 10) + (alea() - 0.5) * 4
          const x = 50 + Math.cos(a) * d
          const y = 50 + Math.sin(a) * d
          const r = 5.2 + alea() * 1.4
          elements.push({ type: 'rond', cx: x + 0.7, cy: y + 0.9, r, couleur: '#201b0c', opacite: 0.14 })
          elements.push({ type: 'tranche', cx: x, cy: y, r, couleur: g.couleur })
        }
        break
      }
      case 'grains': {
        const n = 14 + Math.floor(alea() * 8)
        for (let k = 0; k < n; k++) {
          const a = alea() * Math.PI * 2
          const d = Math.sqrt(alea()) * 9
          const x = cx + Math.cos(a) * d
          const y = cy + Math.sin(a) * d
          const r = 1.5 + alea() * 1.1
          elements.push({ type: 'rond', cx: x + 0.4, cy: y + 0.5, r, couleur: '#201b0c', opacite: 0.14 })
          elements.push({ type: 'rond', cx: x, cy: y, r, couleur: g.couleur })
        }
        break
      }
      case 'base':
        // Une seconde base (une sauce sur du riz) : une flaque plus petite.
        elements.push({ type: 'chemin', d: tache(cx, cy, 10 + alea() * 3, alea, 7, 0.25), couleur: g.couleur })
        break
    }
  })

  // Garniture finale : les herbes, éparpillées sur l'ensemble — hors
  // salade, où elles font déjà le fond.
  for (const g of service === 'salade' ? herbes.slice(1) : herbes) {
    const n = 6 + Math.floor(alea() * 4)
    for (let k = 0; k < n; k++) {
      const a = alea() * Math.PI * 2
      const d = 3 + alea() * 19
      elements.push({
        type: 'feuille',
        cx: 50 + Math.cos(a) * d,
        cy: 50 + Math.sin(a) * d,
        l: 2.6 + alea() * 1.8,
        angle: Math.round(alea() * 360),
        couleur: g.couleur,
      })
    }
  }

  // Le tour de moulin : une poignée de points noirs sur le dessus.
  if (poivre) {
    for (let k = 0; k < 10; k++) {
      const a = alea() * Math.PI * 2
      const d = alea() * 22
      elements.push({
        type: 'rond',
        cx: 50 + Math.cos(a) * d,
        cy: 50 + Math.sin(a) * d,
        r: 0.45 + alea() * 0.3,
        couleur: '#2a2118',
        opacite: 0.7,
      })
    }
  }

  return elements
}

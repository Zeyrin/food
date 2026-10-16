import type { RayonId, RecipeIngredient, Unit } from '../types'

/**
 * « 2 cuillères à soupe d'huile d'olive » → { nom, quantite, unite }.
 *
 * Les sites écrivent leurs ingrédients en phrases ; l'app agrège sur
 * (nom, unité). L'analyse est volontairement prudente : elle propose, le
 * formulaire d'import laisse tout corriger avant l'enregistrement. Ce
 * qu'elle ne reconnaît pas devient « 1 pièce » plutôt que de disparaître.
 */

const FRACTIONS: Record<string, number> = {
  '½': 0.5,
  '¼': 0.25,
  '¾': 0.75,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
  '⅛': 0.125,
}

/** Alias reconnus juste après la quantité → unité de l'app et facteur. */
const UNITES: Array<[RegExp, Unit, number]> = [
  [/^(?:kilogrammes?|kilos?|kg)\b/i, 'kg', 1],
  [/^(?:grammes?|gr?)\b\.?/i, 'g', 1],
  [/^(?:millilitres?|ml)\b/i, 'ml', 1],
  [/^(?:centilitres?|cl)\b/i, 'cl', 1],
  [/^(?:décilitres?|decilitres?|dl)\b/i, 'ml', 100],
  [/^(?:litres?|l)\b\.?/i, 'l', 1],
  [/^(?:cuill?[eè]res?\s+à\s+soupe|c\.?\s*à\s*s\.?|càs|cas|cs|tbsp|tablespoons?)(?=\s|\.|$)/i, 'cs', 1],
  [/^(?:cuill?[eè]res?\s+à\s+caf[eé]|c\.?\s*à\s*c\.?|càc|cac|cc|tsp|teaspoons?)(?=\s|\.|$)/i, 'cc', 1],
  [/^(?:pinc[ée]es?|pinch(?:es)?)\b/i, 'pincee', 1],
  [/^(?:bottes?|bouquets?)\b/i, 'botte', 1],
]

const PLACARD = /^(?:sel|poivre|huile|eau|sucre|fleur de sel|herbes de provence)\b/i

const RAYONS_MOTS: Array<[RayonId, RegExp]> = [
  [
    'viande-poisson',
    /\b(poulet|boeuf|bœuf|porc|veau|agneau|dinde|canard|jambon|lardons?|bacon|saucisse|chorizo|steak|viande|hach[ée]e?|saumon|thon|cabillaud|crevettes?|poisson|merlu|moules?|lieu|filet)\b/i,
  ],
  [
    'cremerie',
    /\b(lait|cr[èe]me|beurre|fromage|yaourt|yogourt|mozzarella|parmesan|gruy[èe]re|emmental|chèvre|chevre|feta|ricotta|mascarpone|reblochon|[œo]ufs?|skyr)\b/i,
  ],
  ['boulangerie', /\b(pain|baguette|brioche|pâte feuilletée|pate feuilletee|pâte brisée|pâte à pizza|tortillas?|wraps?)\b/i],
  ['surgeles', /\b(surgel[ée]s?|glace)\b/i],
  ['boissons', /\b(vin|bière|biere|jus|cidre|rhum|whisky)\b/i],
  [
    'fruits-legumes',
    /\b(carottes?|oignons?|ail|échalotes?|echalotes?|pommes? de terre|patates?|tomates?|courgettes?|aubergines?|poivrons?|poireaux?|champignons?|salade|épinards?|epinards?|citrons?|limes?|oranges?|pommes?|bananes?|persil|coriandre|basilic|menthe|ciboulette|gingembre|brocolis?|chou|courges?|potimarron|concombres?|avocats?|haricots verts|c[ée]leri|fenouil|betteraves?|navets?|radis|herbes?|thym|romarin|piment)\b/i,
  ],
]

export function devinerRayon(nom: string): RayonId {
  for (const [rayon, motif] of RAYONS_MOTS) if (motif.test(nom)) return rayon
  return 'epicerie'
}

/** « 1/2 », « 1,5 », « 1 ½ », « 2-3 » → un nombre (le bas de la fourchette). */
function lireQuantite(texte: string): { quantite: number; reste: string } | null {
  let reste = texte
  let total = 0
  let trouve = false

  // Entier ou décimal, éventuellement suivi d'une fraction (« 1 1/2 », « 1 ½ »).
  const nombre = /^\d+\s*\/\s*\d+/.test(reste)
    ? null
    : reste.match(/^(\d+(?:[.,]\d+)?)(?:\s*[-–à]\s*\d+(?:[.,]\d+)?)?/)
  if (nombre) {
    total += Number(nombre[1]!.replace(',', '.'))
    reste = reste.slice(nombre[0].length).trimStart()
    trouve = true
  }
  const fraction = reste.match(/^(\d+)\s*\/\s*(\d+)/)
  if (fraction && Number(fraction[2]) !== 0) {
    total += Number(fraction[1]) / Number(fraction[2])
    reste = reste.slice(fraction[0].length).trimStart()
    trouve = true
  } else if (reste[0] && reste[0] in FRACTIONS) {
    total += FRACTIONS[reste[0]]!
    reste = reste.slice(1).trimStart()
    trouve = true
  }
  return trouve && total > 0 ? { quantite: Math.round(total * 100) / 100, reste } : null
}

export function analyserIngredient(ligne: string): RecipeIngredient {
  // Les parenthèses sont de l'information annexe (« (environ 400 g) »).
  let texte = ligne
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  let quantite: number | null = null
  let unite: Unit = 'piece'

  const q = lireQuantite(texte)
  if (q) {
    quantite = q.quantite
    texte = q.reste
    for (const [motif, u, facteur] of UNITES) {
      const m = texte.match(motif)
      if (m) {
        unite = u
        quantite = Math.round(quantite * facteur * 100) / 100
        texte = texte.slice(m[0].length).trimStart()
        break
      }
    }
  }

  const nom = texte
    .replace(/^(?:(?:de la|du|des|de)\s+|de l['’]\s*|d['’]\s*)/i, '')
    // « oignon, haché » : la précision de préparation n'est pas l'ingrédient.
    .replace(/,.*$/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()

  const placard = PLACARD.test(nom)
  if (quantite === null) {
    // « Sel », « poivre » : pas de dose écrite.
    quantite = 1
    unite = placard ? 'pincee' : 'piece'
  }

  return {
    nom: nom || ligne.trim().toLowerCase(),
    quantite,
    unite,
    rayon: devinerRayon(nom),
    ...(placard ? { placard: true } : {}),
  }
}

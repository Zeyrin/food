import type { RayonId } from '../types'

/**
 * Un pictogramme par ingrédient, pour la passe « chez moi ». Devant un
 * frigo ouvert, on reconnaît une carotte plus vite qu'on ne lit le mot
 * « carotte » : c'est ce qui rend les tuiles de Bring! si rapides à
 * parcourir. Les noms sont la clé canonique française du corpus — la
 * liste de courses les garde tels quels, quelle que soit la langue.
 *
 * Premier motif qui correspond, dans l'ordre : les plus précis d'abord
 * (« tomate cerise » avant « tomate », « lait de coco » avant « lait »).
 * Un nom inconnu — une recette tapée à la main — retombe sur l'emoji de
 * son rayon, jamais sur un blanc.
 */
const REGLES: [RegExp, string][] = [
  [/lait de coco/, '🥥'],
  [/noix de saint-jacques/, '🐚'],
  [/beurre de cacahu|cacahu/, '🥜'],
  [/moulu|poivre|épices/, '🧂'],
  [/pousses de soja/, '🌱'],
  [/nouille|vermicelle|pâtes|lasagne/, '🍝'],
  [/tofu/, '🫘'],
  [/wakam|algue/, '🌿'],
  [/huile/, '🫗'],
  [/vinaigre|sauce|soja|miso|tahini|hummus|moutarde|mayonnaise|doubanjiang|lao ganma|tamarin|curry/, '🥫'],
  [/citronnelle/, '🌿'],
  [/pois chiche/, '🫘'],
  [/tomate|ketchup/, '🍅'],
  [/pomme de terre|patate/, '🥔'],
  [/pomme/, '🍏'],
  [/carotte/, '🥕'],
  [/^ail\b/, '🧄'],
  [/oignon|échalote|poireau/, '🧅'],
  [/citron vert|combava/, '🍋‍🟩'],
  [/citron/, '🍋'],
  [/orange/, '🍊'],
  [/mangue|papaye/, '🥭'],
  [/cerise/, '🍒'],
  [/avocat/, '🥑'],
  [/aubergine/, '🍆'],
  [/concombre|cornichon|courgette/, '🥒'],
  [/brocoli|chou|kale|pak cho/, '🥦'],
  [/salade|endive|épinard|laitue/, '🥬'],
  [/poivron|piment|harissa|sriracha|espelette/, '🌶️'],
  [/champignon/, '🍄'],
  [/maïs|fécule de maïs/, '🌽'],
  [/gingembre|galanga/, '🫚'],
  [/olive/, '🫒'],
  [/petits pois|edamame|haricots verts|pois/, '🫛'],
  [/haricot|lentille|flageolet/, '🫘'],
  [/coco/, '🥥'],
  [/menthe|persil|coriandre fra|basilic|ciboulette|estragon|thym|bouquet garni|herbes/, '🌿'],
  [/radis|navet|céleri|potimarron|patate douce|courge/, '🥕'],
  [/raisin|pruneau|abricot/, '🍇'],
  [/amande|noix|sésame/, '🌰'],
  [/^œuf/, '🥚'],
  [/lait\b|lait$/, '🥛'],
  [/yaourt|fromage blanc|crème/, '🥛'],
  [/beurre/, '🧈'],
  [/fromage|parmesan|mozzarella|cheddar|comté|reblochon|camembert|chèvre/, '🧀'],
  [/lardon|poitrine|jambon|bacon/, '🥓'],
  [/saucisse|boudin/, '🌭'],
  [/poulet|canard|magret|lapin/, '🍗'],
  [/steak|bœuf|veau|rumsteck|agneau|gigot|porc|rôti|côte|escalope|haché/, '🥩'],
  [/crevette/, '🦐'],
  [/^moules?\b/, '🦪'],
  [/saumon|truite|thon|cabillaud|anchois|poisson|nuoc/, '🐟'],
  [/riz|risotto/, '🍚'],
  [/baguette|pain/, '🥖'],
  [/tortilla|galette|feuilles à gyoza|pâte brisée|pâte feuilletée|pâte à pizza/, '🫓'],
  [/farine|semoule|quinoa|chapelure|levure/, '🌾'],
  [/sucre|miel|vanill/, '🍯'],
  [/chocolat|cacao/, '🍫'],
  [/vin\b|vin rouge|vin blanc/, '🍷'],
  [/^sel\b/, '🧂'],
  [/poivre|cumin|curcuma|paprika|cannelle|muscade|garam|épices|genièvre|câpres/, '🧂'],
  [/bouillon/, '🍲'],
  [/glace|surgel/, '🧊'],
]

const PAR_RAYON: Record<RayonId, string> = {
  'fruits-legumes': '🥬',
  'viande-poisson': '🥩',
  cremerie: '🧀',
  boulangerie: '🥖',
  epicerie: '🥫',
  surgeles: '🧊',
  boissons: '🧃',
  autre: '🛒',
}

export function emojiIngredient(nom: string, rayon: RayonId): string {
  const n = nom.toLowerCase()
  for (const [motif, emoji] of REGLES) if (motif.test(n)) return emoji
  return PAR_RAYON[rayon]
}

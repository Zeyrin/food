import assert from 'node:assert/strict'
import { annoterEtape, formatQuantite } from './aggregate'
import type { Unit } from '../types'

const ing = (nom: string, quantite: number, unite: Unit) => ({ nom, quantite, unite })
const rendu = (texte: string, ingredients: Parameters<typeof annoterEtape>[1]) =>
  annoterEtape(texte, ingredients)
    .map((s) => s.texte + (s.quantite ? ` [${s.quantite}]` : ''))
    .join('')

// Pluriel du texte contre singulier de la fiche, et inversement.
assert.equal(
  rendu("cuire les pâtes", [ing('pâtes longues', 200, 'g')]),
  'cuire les pâtes [200 g]',
)
assert.equal(rendu('ajouter le citron', [ing('citrons', 2, 'piece')]), 'ajouter le citron [2]')

// Une seule annotation par ingrédient, même cité deux fois.
assert.equal(
  rendu('crème puis crème', [ing('crème fraîche', 10, 'cl')]),
  'crème [10 cl] puis crème',
)

// Mots courts ignorés : « ail », « sel » sont trop fréquents.
assert.equal(rendu("hacher l'ail et saler", [ing('ail', 3, 'piece')]), "hacher l'ail et saler")

// Pas de correspondance partielle : « parmesan » ne matche pas « par ».
assert.equal(rendu('couper par le milieu', [ing('parmesan', 60, 'g')]), 'couper par le milieu')

// Texte intact quand rien ne matche, et sans ingrédients.
assert.equal(rendu('Préchauffer le four.', []), 'Préchauffer le four.')

// Nom composé : l'annotation doit suivre le qualificatif ("nouveaux"),
// pas se glisser au milieu du groupe nominal ("oignons 1 botte nouveaux").
assert.equal(
  rendu('ciseler les oignons nouveaux', [ing('oignon nouveau', 1, 'botte')]),
  'ciseler les oignons nouveaux [1 botte]',
)

// Deux ingrédients dans la même phrase, l'un après l'autre sans se marcher dessus.
assert.equal(
  rendu('Tailler les carottes en petits dés, ciseler les oignons nouveaux.', [
    ing('carotte', 2, 'piece'),
    ing('oignon nouveau', 1, 'botte'),
  ]),
  'Tailler les carottes [2] en petits dés, ciseler les oignons nouveaux [1 botte].',
)

// La quantité se pose après le groupe nominal entier, jamais après le
// seul premier mot ("l'huile [1 c. à s.] de sésame").
assert.equal(
  rendu("verser l'huile de sésame", [ing('huile de sésame', 1, 'cs')]),
  "verser l'huile de sésame [1 c. à s.]",
)
assert.equal(
  rendu('tremper une galette de riz', [ing('galettes de riz', 8, 'piece')]),
  'tremper une galette de riz [8]',
)

// Trait d'union : « chou-fleur » de la fiche contre « chou-fleur » du texte.
assert.equal(
  rendu('détailler le chou-fleur', [ing('chou-fleur', 800, 'g')]),
  'détailler le chou-fleur [800 g]',
)

// Même tête pour deux ingrédients : c'est la suite du texte qui tranche.
assert.equal(
  rendu("l'huile de sésame et l'huile d'olive", [
    ing("huile d'olive", 3, 'cs'),
    ing('huile de sésame', 1, 'cs'),
  ]),
  "l'huile de sésame [1 c. à s.] et l'huile d'olive [3 c. à s.]",
)

// Tête générique non qualifiée : « la sauce nappe » n'est pas la sauce soja.
assert.equal(
  rendu('remuer jusqu\'à ce que la sauce nappe', [ing('sauce soja', 1, 'cs')]),
  "remuer jusqu'à ce que la sauce nappe",
)
// Mais qualifiée, elle compte.
assert.equal(
  rendu('verser la sauce soja', [ing('sauce soja', 1, 'cs')]),
  'verser la sauce soja [1 c. à s.]',
)
// Et « pâtes » au pluriel nomme le plat, pas un contenant.
assert.equal(rendu('cuire les pâtes', [ing('pâtes', 200, 'g')]), 'cuire les pâtes [200 g]')

// Une pièce unique n'a pas de quantité à annoncer : « le reblochon 1 »
// n'apprend rien. Au-delà de un, si.
assert.equal(
  rendu('couper le reblochon en deux', [ing('reblochon', 1, 'piece')]),
  'couper le reblochon en deux',
)
assert.equal(rendu('émincer les carottes', [ing('carotte', 2, 'piece')]), 'émincer les carottes [2]')

// Accord des unités, pas de « (s) ».
assert.equal(formatQuantite({ quantite: 1, unite: 'botte' }), '1 botte')
assert.equal(formatQuantite({ quantite: 2, unite: 'botte' }), '2 bottes')
assert.equal(formatQuantite({ quantite: 1, unite: 'pincee' }), '1 pincée')

// --- Marqueurs explicites : l'auteur désigne, on n'invente rien. ---

// Les accolades disparaissent, la dose se pose après.
assert.equal(
  rendu('Cuire les {pâtes} dans l\'eau salée.', [ing('pâtes longues', 200, 'g')]),
  "Cuire les pâtes [200 g] dans l'eau salée.",
)

// Le texte affiché peut différer du nom canonique.
assert.equal(
  rendu('Ciseler les {oignons nouveaux}.', [ing('oignon nouveau', 1, 'botte')]),
  'Ciseler les oignons nouveaux [1 botte].',
)

// Ce qui n'est pas marqué n'est pas annoté : c'est le remède à
// « la moitié du reblochon 1 ».
assert.equal(
  rendu('Râper la moitié du reblochon sur le {gratin}.', [
    ing('reblochon', 450, 'g'),
    ing('gratin dauphinois', 1, 'piece'),
  ]),
  'Râper la moitié du reblochon sur le gratin.',
)

// Deux marqueurs dans la même phrase.
assert.equal(
  rendu('Mélanger le {tahini} et le {yaourt}.', [
    ing('tahini', 3, 'cs'),
    ing('yaourt grec', 150, 'g'),
  ]),
  'Mélanger le tahini [3 c. à s.] et le yaourt [150 g].',
)

// Marqueur qui ne correspond à aucun ingrédient : le mot reste lisible.
assert.equal(rendu('Ajouter le {wasabi}.', [ing('tofu', 400, 'g')]), 'Ajouter le wasabi.')

// Une étape sans marqueur retombe sur l'heuristique, même dans une
// recette dont les autres étapes en ont.
assert.equal(rendu('Cuire les pâtes.', [ing('pâtes longues', 200, 'g')]), 'Cuire les pâtes [200 g].')

// --- Mise en forme des quantités ------------------------------------------

// L'unité métrique s'écrit telle quelle, l'unité de cuisine s'accorde,
// et « 1 pièce » ne s'écrit pas : le nom au singulier le dit déjà.
assert.equal(formatQuantite({ quantite: 200, unite: 'g' }), '200 g')
assert.equal(formatQuantite({ quantite: 1, unite: 'botte' }), '1 botte')
assert.equal(formatQuantite({ quantite: 2, unite: 'botte' }), '2 bottes')
assert.equal(formatQuantite({ quantite: 3, unite: 'cs' }), '3 c. à s.')
assert.equal(formatQuantite({ quantite: 2, unite: 'piece' }), '2')

// En cuisine on lit ½, pas 0,5 — et un demi de plus qu'un entier garde
// l'entier devant.
assert.equal(formatQuantite({ quantite: 0.5, unite: 'cc' }), '½ c. à c.')
assert.equal(formatQuantite({ quantite: 1.5, unite: 'cc' }), '1½ c. à c.')

// Hors fraction connue, séparateur décimal de la langue affichée
// (français par défaut, y compris ici : voir lireLangueSauvegardee).
assert.equal(formatQuantite({ quantite: 1.2, unite: 'l' }), '1,2 l')

console.log('ok')

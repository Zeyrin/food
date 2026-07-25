import assert from 'node:assert/strict'
import { annoterEtape } from './aggregate'
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
// pas se glisser au milieu du groupe nominal ("oignons 1 botte(s) nouveaux").
assert.equal(
  rendu('ciseler les oignons nouveaux', [ing('oignon nouveau', 1, 'botte')]),
  'ciseler les oignons nouveaux [1 botte(s)]',
)

// Deux ingrédients dans la même phrase, l'un après l'autre sans se marcher dessus.
assert.equal(
  rendu('Tailler la carotte en petits dés, ciseler les oignons nouveaux.', [
    ing('carotte', 1, 'piece'),
    ing('oignon nouveau', 1, 'botte'),
  ]),
  'Tailler la carotte [1] en petits dés, ciseler les oignons nouveaux [1 botte(s)].',
)

console.log('ok')

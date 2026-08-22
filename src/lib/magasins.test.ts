import assert from 'node:assert/strict'
import { buildList } from './aggregate'
import { CONFIG_PAR_DEFAUT, grouperPourCourses, magasinDuRayon, normaliserConfig } from './magasins'
import type { ConfigMagasins } from './magasins'
import type { ListItem, RayonId, Recipe } from '../types'

const ligne = (nom: string, rayon: RayonId): ListItem => ({
  key: `${nom}|piece`,
  nom,
  quantite: 1,
  unite: 'piece',
  rayon,
  origines: [],
})

const LISTE = [
  ligne('carotte', 'fruits-legumes'),
  ligne('riz', 'epicerie'),
  ligne('poulet', 'viande-poisson'),
]

// --- Le cas de la majorité : un seul magasin -------------------------------

const seul = grouperPourCourses(LISTE, CONFIG_PAR_DEFAUT)
assert.equal(seul.length, 1)
// Tout y est, dans l'ordre des rayons, sans avoir rien eu à régler.
assert.deepEqual(
  seul[0]!.rayons.map((r) => r.rayon),
  ['fruits-legumes', 'viande-poisson', 'epicerie'],
)

// --- Le cas « mes légumes ailleurs » ---------------------------------------

const DEUX: ConfigMagasins = {
  magasins: [
    { id: 'super', nom: 'Supermarché' },
    { id: 'marche', nom: 'Marché' },
  ],
  routage: { 'fruits-legumes': 'marche' },
}

// Les magasins sortent dans l'ordre du parcours, pas dans celui des rayons.
const deux = grouperPourCourses(LISTE, DEUX)
assert.deepEqual(
  deux.map((g) => g.magasin.id),
  ['super', 'marche'],
)
// Un seul rayon a été déplacé : les autres restent au premier magasin,
// personne n'a à router les huit rayons pour en changer un.
assert.deepEqual(deux[0]!.rayons.map((r) => r.rayon), ['viande-poisson', 'epicerie'])
assert.deepEqual(deux[1]!.rayons.map((r) => r.rayon), ['fruits-legumes'])
assert.equal(magasinDuRayon('epicerie', DEUX).id, 'super')

// Un magasin où il n'y a rien à prendre cette semaine ne s'affiche pas.
const legumesSeuls = grouperPourCourses([ligne('carotte', 'fruits-legumes')], DEUX)
assert.deepEqual(
  legumesSeuls.map((g) => g.magasin.id),
  ['marche'],
)

// --- Config abîmée : rien ne doit disparaître de la liste ------------------

// Le magasin visé par le routage n'existe plus (supprimé dans les réglages).
const orphelin = normaliserConfig({
  magasins: [{ id: 'super', nom: 'Supermarché' }],
  routage: { 'fruits-legumes': 'marche' },
})
assert.deepEqual(orphelin.routage, {})
assert.equal(grouperPourCourses(LISTE, orphelin)[0]!.rayons.length, 3)

// Plus aucun magasin : on repart du défaut plutôt que de planter.
assert.deepEqual(normaliserConfig({ magasins: [], routage: {} }), CONFIG_PAR_DEFAUT)
assert.deepEqual(normaliserConfig(null), CONFIG_PAR_DEFAUT)

// --- Le rayon vient de la recette, y compris ancienne ----------------------

const recette = (ingredients: Recipe['ingredients']): Recipe => ({
  id: 'r',
  titre: 'R',
  temps: 10,
  portions: 2,
  tags: [],
  ingredients,
  etapes: ['…'],
})

const items = buildList(
  [{ recipeId: 'r', portions: 2 }],
  [
    recette([
      { nom: 'carotte', quantite: 2, unite: 'piece', rayon: 'fruits-legumes' },
      // Écrite avant les rayons : traduite à la lecture.
      { nom: 'tofu', quantite: 200, unite: 'g', magasin: 'primeur' } as Recipe['ingredients'][number],
    ]),
  ],
)
assert.deepEqual(
  items.map((i) => i.rayon),
  ['fruits-legumes', 'fruits-legumes'],
)

import assert from 'node:assert/strict'
import { validerCollage } from './collerRecettes'

const RECETTE = {
  titre: 'Dahl de lentilles corail',
  temps: 30,
  portions: 4,
  tags: ['végé'],
  ingredients: [{ nom: 'lentilles corail', quantite: 250, unite: 'g', magasin: 'primeur' }],
  etapes: ['Émincer.', 'Cuire.'],
}

const json = (x: unknown) => JSON.stringify(x)
/** Même recette, autre titre — les titres identiques sont désormais fusionnés. */
const autre = (titre: string) => ({ ...RECETTE, titre })

// Le collage propre, celui que le prompt demande.
assert.equal(validerCollage(json(RECETTE)).recettes.length, 1)

// Ce qu'une IA renvoie vraiment : bloc de code, avec ou sans langage,
// et des phrases de politesse autour.
assert.equal(validerCollage('```json\n' + json(RECETTE) + '\n```').recettes.length, 1)
assert.equal(validerCollage('```\n' + json(RECETTE) + '\n```').recettes.length, 1)
assert.equal(validerCollage(`Voici !\n${json(RECETTE)}\nBon appétit 🍲`).recettes.length, 1)

// Demander « 5 recettes » renvoie un tableau : il passe en un collage.
assert.equal(validerCollage(json([RECETTE, autre('Deux'), autre('Trois')])).recettes.length, 3)
assert.equal(
  validerCollage('Bien sûr :\n```json\n' + json([RECETTE, autre('Deux')]) + '\n```\n').recettes.length,
  2,
)

// Deux recettes d'un même lot ne partagent pas d'identifiant.
const lot = validerCollage(json([RECETTE, autre('Deux')]))
assert.notEqual(lot.recettes[0]!.id, lot.recettes[1]!.id)

// Recoller la même réponse est un geste banal : le catalogue ne doit pas
// se remplir de doublons en silence. Le titre est signalé, pas ajouté.
const deja = validerCollage(json(RECETTE), [RECETTE.titre])
assert.equal(deja.recettes.length, 0)
assert.deepEqual(deja.doublons, [RECETTE.titre])

// La comparaison ignore accents, casse et espaces en trop.
assert.equal(validerCollage(json(RECETTE), ['  DAHL DE LENTILLES CORAIL ']).recettes.length, 0)

// Un lot qui répète deux fois le même plat ne l'ajoute qu'une fois.
const repete = validerCollage(json([RECETTE, RECETTE, autre('Vraiment neuve')]))
assert.equal(repete.recettes.length, 2)
assert.equal(repete.doublons.length, 1)

// Le reste du lot entre quand même quand un seul titre est déjà connu.
const melange = validerCollage(json([RECETTE, autre('Vraiment neuve')]), [RECETTE.titre])
assert.equal(melange.recettes.length, 1)
assert.equal(melange.recettes[0]!.titre, 'Vraiment neuve')

// Une recette invalide dans le lot ne bloque pas les autres, et son
// titre apparaît dans l'erreur pour qu'on sache laquelle reprendre.
const mixte = validerCollage(
  json([RECETTE, { ...RECETTE, titre: 'Raté', ingredients: [{ nom: 'a', quantite: 1, unite: 'litres', magasin: 'primeur' }] }]),
)
assert.equal(mixte.recettes.length, 1)
assert.ok(mixte.erreurs.some((e) => e.startsWith('Raté : ')))

// Rien d'exploitable : un message, aucune recette.
for (const entree of ['   ', 'Je ne peux pas faire ça.', '{"titre": "Coupé", "temps": 3']) {
  const r = validerCollage(entree)
  assert.equal(r.recettes.length, 0)
  assert.ok(r.erreurs.length > 0)
}

console.log('ok')

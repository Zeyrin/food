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

// Le collage propre, celui que le prompt demande.
assert.equal(validerCollage(json(RECETTE)).recettes.length, 1)

// Ce qu'une IA renvoie vraiment : bloc de code, avec ou sans langage,
// et des phrases de politesse autour.
assert.equal(validerCollage('```json\n' + json(RECETTE) + '\n```').recettes.length, 1)
assert.equal(validerCollage('```\n' + json(RECETTE) + '\n```').recettes.length, 1)
assert.equal(validerCollage(`Voici !\n${json(RECETTE)}\nBon appétit 🍲`).recettes.length, 1)

// Demander « 5 recettes » renvoie un tableau : il passe en un collage.
assert.equal(validerCollage(json([RECETTE, RECETTE, RECETTE])).recettes.length, 3)
assert.equal(validerCollage('Bien sûr :\n```json\n' + json([RECETTE, RECETTE]) + '\n```\n').recettes.length, 2)

// Deux recettes d'un même lot ne partagent pas d'identifiant.
const lot = validerCollage(json([RECETTE, RECETTE]))
assert.notEqual(lot.recettes[0]!.id, lot.recettes[1]!.id)

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

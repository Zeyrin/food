import assert from 'node:assert/strict'
import { appliquerPatch, diffListe, fusionnerPatchs } from './patchListe'
import type { ListState } from '../types'

const base: ListState = {
  coche: { 'lait|ml': true },
  dejaPossede: {},
  panier: [{ recipeId: 'a', portions: 2 }],
}

// --- Deux personnes cochent en même temps : aucune case ne se perd --------

const chezA = { ...base, coche: { ...base.coche, 'oeuf|piece': true } }
const chezB = { ...base, coche: { ...base.coche, 'pain|piece': true } }
const patchA = diffListe(base, chezA)!
const patchB = diffListe(base, chezB)!
assert.deepEqual(patchA, { coche: { 'oeuf|piece': true } })

// La base applique les deux, dans un ordre ou dans l'autre.
for (const [p1, p2] of [
  [patchA, patchB],
  [patchB, patchA],
]) {
  const fin = appliquerPatch(appliquerPatch(base, p1!), p2!)
  assert.deepEqual(fin.coche, { 'lait|ml': true, 'oeuf|piece': true, 'pain|piece': true })
}

// Décocher se transmet comme `false`, pas comme une absence.
assert.deepEqual(diffListe(base, { ...base, coche: {} }), { coche: { 'lait|ml': false } })

// --- Ajouter un plat pendant que l'autre coche : le panier ne décoche rien -

const panierPlus = { ...base, panier: [...base.panier!, { recipeId: 'b', portions: 4 }] }
const patchPanier = diffListe(base, panierPlus)!
assert.equal(patchPanier.coche, undefined)
const fin = appliquerPatch(appliquerPatch(base, patchA), patchPanier)
assert.equal(fin.coche['oeuf|piece'], true)
assert.equal(fin.panier!.length, 2)

// --- Vider le panier repart de zéro des deux côtés -----------------------

const vide = diffListe(base, { coche: {}, dejaPossede: {}, items: [], panier: [] })!
assert.equal(vide.remplacer, true)
assert.deepEqual(appliquerPatch(fin, vide), { coche: {}, dejaPossede: {}, items: [], panier: [] })

// Rien n'a changé → rien à envoyer.
assert.equal(diffListe(base, { ...base }), null)

// --- Hors ligne : les patchs s'accumulent, le dernier mot gagne par case --

const attente = fusionnerPatchs(fusionnerPatchs(null, patchA), { coche: { 'oeuf|piece': false, 'riz|g': true } })
assert.deepEqual(attente.coche, { 'oeuf|piece': false, 'riz|g': true })

// Un vidage suivi d'une case cochée reste un remplacement complet.
const apresVidage = fusionnerPatchs(vide, { coche: { 'riz|g': true } })
assert.equal(apresVidage.remplacer, true)
assert.deepEqual(apresVidage.coche, { 'riz|g': true })

console.log('patchListe : ok')

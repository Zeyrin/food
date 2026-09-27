import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { ListState } from '../types'
import { enAvanceSur, fusionner, horodater } from './fusionListe'

const vide: ListState = { coche: {}, dejaPossede: {} }
const cocher = (etat: ListState, cle: string, v = true) => horodater(etat, { ...etat, coche: { ...etat.coche, [cle]: v } })

test("l'écho d'un état plus ancien ne décoche pas ce qu'on vient de cocher", () => {
  const un = cocher(vide, 'ail')
  const deux = cocher(un, 'citron')
  // L'écho de la première écriture arrive après le second appui.
  const apres = fusionner(deux, un)
  assert.equal(apres.coche.ail, true)
  assert.equal(apres.coche.citron, true)
})

test('deux téléphones qui cochent chacun de leur côté gardent tout', () => {
  const maison = cocher(vide, 'ail')
  const magasin = cocher(vide, 'tomate')
  for (const f of [fusionner(maison, magasin), fusionner(magasin, maison)]) {
    assert.equal(f.coche.ail, true)
    assert.equal(f.coche.tomate, true)
  }
  assert.ok(enAvanceSur(maison, magasin))
  assert.ok(!enAvanceSur(fusionner(maison, magasin), fusionner(magasin, maison)))
})

test('un décochage plus récent l’emporte sur un cochage plus ancien', () => {
  const coche = cocher(vide, 'ail')
  const decoche = cocher(coche, 'ail', false)
  assert.equal(fusionner(decoche, coche).coche.ail, false)
  assert.equal(fusionner(coche, decoche).coche.ail, false)
})

test("un téléphone resté en veille n'efface pas les cases de l'autre", () => {
  const perime = { ...vide, panier: [{ recipeId: 'x', portions: 2 }] }
  const autre = cocher(perime, 'ail')
  // Le téléphone en veille change les parts sans avoir vu la case.
  const reveil = horodater(perime, { ...perime, panier: [{ recipeId: 'x', portions: 4 }] })
  const f = fusionner(autre, reveil)
  assert.equal(f.coche.ail, true)
  assert.equal(f.panier?.[0]?.portions, 4)
})

test('vider le panier efface aussi les cases gardées par l’autre téléphone', () => {
  const ancien = cocher(vide, 'ail')
  const vidage = horodater(ancien, { ...vide, items: [], panier: [] }, true)
  const f = fusionner(vidage, ancien)
  assert.deepEqual(f.coche, {})
  assert.deepEqual(f.panier, [])
  // Une case cochée après le vidage survit.
  const apres = cocher(f, 'tomate')
  assert.equal(fusionner(apres, ancien).coche.tomate, true)
})

test('un état d’avant les horodatages ne perd aucune case cochée', () => {
  const ancien: ListState = { coche: { ail: true }, dejaPossede: {}, panier: [{ recipeId: 'x', portions: 2 }] }
  const f = fusionner(vide, ancien)
  assert.equal(f.coche.ail, true)
  assert.equal(f.panier?.length, 1)
})

test("un geste calculé sur l'état affiché ne défait pas un changement arrivé entre-temps", () => {
  const affiche = cocher(vide, 'ail')
  // L'autre téléphone coche « tomate » ; l'écran n'a pas encore re-rendu.
  const actuel = fusionner(affiche, cocher(affiche, 'tomate'))
  const geste = horodater(affiche, { ...affiche, coche: { ...affiche.coche, citron: true } })
  const f = fusionner(actuel, geste)
  assert.equal(f.coche.tomate, true)
  assert.equal(f.coche.citron, true)
  assert.equal(f.coche.ail, true)
})

/**
 * Deux téléphones, un serveur qui garde la dernière écriture reçue, des
 * messages qui arrivent en retard et dans le désordre, et des passages
 * hors réseau. Même protocole que App.tsx : chaque geste est horodaté et
 * publié ; chaque état reçu est fusionné, et republié si on en sait plus.
 * À la fin, une fois le réseau revenu, les deux téléphones et le serveur
 * doivent être d'accord, et chaque case doit avoir la valeur de son
 * dernier geste — où qu'il ait été fait.
 */
test('deux téléphones convergent malgré le désordre et les coupures', () => {
  let graine = 7
  const hasard = () => ((graine = (graine * 16807) % 2147483647) / 2147483647)
  const produits = ['ail', 'citron', 'tomate', 'oignon', 'riz', 'lait']
  const telephones = [{ etat: vide, horsLigne: false }, { etat: vide, horsLigne: false }]
  let serveur: ListState = vide
  // File de messages : [moment de livraison, action].
  let file: [number, () => void][] = []
  let tic = 0
  const plusTard = (action: () => void) => file.push([tic + 1 + Math.floor(hasard() * 6), action])
  const attendu: Record<string, boolean> = {}

  const publier = (t: (typeof telephones)[number]) => {
    if (t.horsLigne) return
    const envoye = t.etat
    plusTard(() => {
      serveur = envoye // dernier écrivain gagne, comme la table `listes`
      for (const autre of telephones) {
        const recu = serveur
        plusTard(() => recevoir(autre, recu))
      }
    })
  }
  const recevoir = (t: (typeof telephones)[number], distant: ListState) => {
    if (t.horsLigne) return
    t.etat = fusionner(t.etat, distant)
    if (enAvanceSur(t.etat, distant)) publier(t)
  }

  for (tic = 0; tic < 400; tic++) {
    const t = telephones[Math.floor(hasard() * 2)]!
    const r = hasard()
    if (r < 0.1) t.horsLigne = !t.horsLigne
    else if (r < 0.6) {
      const p = produits[Math.floor(hasard() * produits.length)]!
      const valeur = !t.etat.coche[p]
      t.etat = cocher(t.etat, p, valeur)
      attendu[p] = valeur
      publier(t)
    }
    const maintenant = file.filter(([m]) => m <= tic)
    file = file.filter(([m]) => m > tic)
    for (const [, action] of maintenant.sort(() => hasard() - 0.5)) action()
  }
  // Retour du réseau : chacun relit le serveur (le rattrapage d'App.tsx),
  // puis on laisse tout se livrer.
  for (const t of telephones) {
    t.horsLigne = false
    const recu = serveur
    plusTard(() => recevoir(t, recu))
  }
  for (let fin = 0; fin < 200 && file.length; fin++, tic++) {
    const maintenant = file.filter(([m]) => m <= tic)
    file = file.filter(([m]) => m > tic)
    for (const [, action] of maintenant) action()
  }

  for (const t of telephones) assert.deepEqual(t.etat.coche, serveur.coche)
  for (const [p, v] of Object.entries(attendu)) assert.equal(serveur.coche[p] === true, v, p)
})

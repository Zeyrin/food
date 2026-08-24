import assert from 'node:assert/strict'
import test from 'node:test'
import { suivre, suivreErreur } from './analytique'

/**
 * Une seule chose à garantir, mais elle compte : la mesure ne tombe
 * jamais dans l'app. Le script Rybbit manque chez plus de monde qu'on
 * ne croit — bloqueur de publicité, réseau coupé, `npm run dev` sans
 * la balise — et un `suivre` qui lève au milieu d'un rendu emmène
 * l'écran avec lui, pour un compteur.
 */

type FenetreFeinte = { rybbit?: unknown }

function avecFenetre(rybbit: unknown, corps: () => void) {
  const precedent = (globalThis as { window?: FenetreFeinte }).window
  ;(globalThis as { window?: FenetreFeinte }).window =
    rybbit === undefined ? {} : { rybbit }
  try {
    corps()
  } finally {
    ;(globalThis as { window?: FenetreFeinte }).window = precedent
  }
}

test('sans script Rybbit, suivre ne lève pas', () => {
  avecFenetre(undefined, () => {
    assert.doesNotThrow(() => suivre('foyer_cree'))
    assert.doesNotThrow(() => suivre('panier_ajout', { recette: 'mapo-tofu' }))
    assert.doesNotThrow(() => suivreErreur('boum'))
  })
})

test('sans window du tout, suivre ne lève pas', () => {
  const precedent = (globalThis as { window?: FenetreFeinte }).window
  delete (globalThis as { window?: FenetreFeinte }).window
  try {
    assert.doesNotThrow(() => suivre('foyer_cree'))
  } finally {
    ;(globalThis as { window?: FenetreFeinte }).window = precedent
  }
})

test('le nom et les propriétés arrivent tels quels', () => {
  const recus: Array<[string, unknown]> = []
  avecFenetre({ event: (n: string, p: unknown) => recus.push([n, p]) }, () => {
    suivre('panier_ajout', { recette: 'mapo-tofu' })
    suivre('foyer_cree')
  })
  assert.deepEqual(recus, [
    ['panier_ajout', { recette: 'mapo-tofu' }],
    ['foyer_cree', undefined],
  ])
})

test('un script Rybbit qui lève reste sans effet sur l’app', () => {
  avecFenetre(
    {
      event: () => {
        throw new Error('serveur injoignable')
      },
      error: () => {
        throw new Error('serveur injoignable')
      },
    },
    () => {
      assert.doesNotThrow(() => suivre('foyer_cree'))
      assert.doesNotThrow(() => suivreErreur('boum'))
    },
  )
})

test('un message d’erreur trop long est tronqué avant l’envoi', () => {
  const recus: string[] = []
  avecFenetre({ error: (m: string) => recus.push(m) }, () => {
    suivreErreur('x'.repeat(500))
  })
  assert.equal(recus[0]?.length, 200)
})

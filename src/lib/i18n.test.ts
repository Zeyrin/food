import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dictionnaires, type Dico } from './i18n'

/**
 * Ce que `lint:recipes` fait pour le corpus, ce fichier le fait pour le
 * dictionnaire. Une traduction manquante ne se voit pas à l'usage : `t`
 * retombe sur le français, l'écran s'affiche, et personne ne remarque
 * l'îlot francophone au milieu de l'anglais. Il n'y a donc que ce test
 * pour le dire.
 */

/** Chemins pointés (`liste.titre`), tableaux compris (`onboarding.0.titre`). */
function chemins(dico: Dico, prefixe = ''): string[] {
  return Object.entries(dico).flatMap(([cle, valeur]) => {
    if (typeof valeur === 'string') return [prefixe + cle]
    if (Array.isArray(valeur)) return valeur.flatMap((e, i) => chemins(e, `${prefixe}${cle}.${i}.`))
    return chemins(valeur, `${prefixe}${cle}.`)
  })
}

const valeur = (dico: Dico, chemin: string): string =>
  chemin.split('.').reduce<unknown>((cur, k) => (cur as Dico)?.[k], dico) as string

/** Les noms cités par un libellé, en ensemble : `{{s}}` deux fois vaut une. */
const variables = (texte: string) =>
  new Set([...texte.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]!))

const cheminsFr = chemins(dictionnaires.fr)
const cheminsEn = chemins(dictionnaires.en)

// Les deux colonnes couvrent exactement les mêmes clés.
assert.deepEqual(
  cheminsFr.filter((c) => !cheminsEn.includes(c)),
  [],
  'clés traduites en français mais pas en anglais',
)
assert.deepEqual(
  cheminsEn.filter((c) => !cheminsFr.includes(c)),
  [],
  'clés traduites en anglais mais absentes du français',
)

for (const chemin of cheminsFr) {
  const fr = valeur(dictionnaires.fr, chemin)
  const en = valeur(dictionnaires.en, chemin)

  // Un libellé vide passe le test de présence et laisse un trou à l'écran.
  assert.ok(fr.trim().length > 0, `libellé français vide : ${chemin}`)
  assert.ok(en.trim().length > 0, `libellé anglais vide : ${chemin}`)

  // Une variable oubliée dans la traduction, c'est un nombre ou un titre
  // qui disparaît de la phrase — « retiré du panier » sans le plat.
  assert.deepEqual(
    [...variables(en)].sort(),
    [...variables(fr)].sort(),
    `variables {{…}} différentes entre fr et en : ${chemin}`,
  )
}

/**
 * Toute clé citée en dur dans le code doit exister. Sinon `t` rend le
 * chemin lui-même, et c'est « liste.envoyerListe » qui s'affiche sur le
 * bouton. Les clés composées à la volée (`t(\`rayons.${'${rayon}'}\`)`)
 * échappent forcément à cette passe : elles sont couvertes par le repli
 * explicite des écrans qui les utilisent.
 */
function fichiersSource(dossier: string): string[] {
  return readdirSync(dossier, { withFileTypes: true }).flatMap((e) => {
    const chemin = join(dossier, e.name)
    if (e.isDirectory()) return fichiersSource(chemin)
    return /\.tsx?$/.test(e.name) && !e.name.endsWith('.test.ts') ? [chemin] : []
  })
}

const CITATION = /\b(?:t|traduire)\(\s*'([a-zA-Z0-9_.]+)'/g

// Relatif au fichier de test, pas au répertoire courant : le test doit
// donner le même résultat lancé depuis n'importe où.
const RACINE = fileURLToPath(new URL('../..', import.meta.url))

for (const fichier of fichiersSource(join(RACINE, 'src'))) {
  const source = readFileSync(fichier, 'utf8')
  for (const m of source.matchAll(CITATION)) {
    const chemin = m[1]!
    assert.ok(
      typeof valeur(dictionnaires.fr, chemin) === 'string',
      `${relative(RACINE, fichier)} cite une clé absente du dictionnaire : ${chemin}`,
    )
  }
}

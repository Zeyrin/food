#!/usr/bin/env node
/**
 * Deux invariants que rien ne signale quand ils cassent :
 *
 * 1. La parité des clés fr/en. `t()` renvoie la clé quand elle manque —
 *    l'écran affiche alors « panier.genererListe » en toutes lettres, et
 *    seul quelqu'un qui bascule la langue le voit.
 * 2. La couverture des crédits photo. Les licences Creative Commons
 *    imposent de citer l'auteur : une recette ajoutée avec sa photo mais
 *    sans sa ligne dans `public/credits.html` est un manquement, pas un
 *    détail de présentation.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import type { Recipe } from '../src/types'

const racine = join(dirname(fileURLToPath(import.meta.url)), '..')
const lire = (p: string) => readFileSync(join(racine, p), 'utf8')

const erreurs: string[] = []

// --- 1. Parité des dictionnaires -------------------------------------------

const i18n = lire('src/lib/i18n.tsx')

/** Extrait le littéral d'objet d'un dictionnaire en comptant ses accolades. */
function bloc(nom: string): string {
  const debut = i18n.indexOf(`const ${nom}: Dico = {`)
  if (debut === -1) throw new Error(`Dictionnaire « ${nom} » introuvable dans i18n.tsx`)
  let profondeur = 0
  const ouvrante = i18n.indexOf('{', debut)
  for (let i = ouvrante; i < i18n.length; i++) {
    if (i18n[i] === '{') profondeur++
    else if (i18n[i] === '}' && --profondeur === 0) return i18n.slice(ouvrante, i + 1)
  }
  throw new Error(`Accolade non refermée dans « ${nom} »`)
}

const cles = (txt: string) => new Set([...txt.matchAll(/^\s{2,}([A-Za-zÀ-ÿ0-9_]+):/gm)].map((m) => m[1]!))
const fr = cles(bloc('fr'))
const en = cles(bloc('en'))

for (const c of fr) if (!en.has(c)) erreurs.push(`i18n : « ${c} » présent en fr, absent en en`)
for (const c of en) if (!fr.has(c)) erreurs.push(`i18n : « ${c} » présent en en, absent en fr`)

// --- 2. Crédits photo -------------------------------------------------------

const recettes: Recipe[] = JSON.parse(lire('src/data/recipes.json'))
const credits = lire('public/credits.html')

const decoder = (s: string) =>
  s.replace(/&amp;/g, '&').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')

const credites = new Set(
  [...credits.matchAll(/<th scope="row">([^<]*)<\/th>/g)].map((m) => decoder(m[1]!)),
)

for (const r of recettes) {
  if (r.image && !credites.has(r.titre)) {
    erreurs.push(`crédits : « ${r.titre} » a une photo mais aucune ligne dans public/credits.html`)
  }
}

const titres = new Set(recettes.map((r) => r.titre))
for (const c of credites) {
  if (!titres.has(c)) erreurs.push(`crédits : ligne « ${c} » ne correspond à aucune recette`)
}

// Une photo livrée que plus aucune recette ne réclame gonfle le précache
// du service worker sans jamais s'afficher.
const utilisees = new Set(recettes.map((r) => r.image).filter(Boolean))
for (const fichier of readdirSync(join(racine, 'public/plats'))) {
  if (!utilisees.has(`/plats/${fichier}`)) erreurs.push(`photos : /plats/${fichier} n'est utilisée par aucune recette`)
}

// --- 3. Un seul domaine canonique -------------------------------------------

// L'app tournait sur www.fffood.fr pendant que `canonical`, `og:url`,
// `og:image`, le sitemap et robots.txt désignaient tous une URL Vercel.
// Conséquences invisibles depuis l'app : un moteur de recherche consolide
// vers l'URL annoncée plutôt que vers celle qu'on partage, et l'aperçu d'un
// lien envoyé par SMS affiche ce domaine-là. Ces cinq mentions sont
// désormais tenues d'être d'accord.
const html = lire('index.html')
const domaines = new Set<string>()

const releve = [
  ...[...html.matchAll(/<link rel="canonical" href="(https?:\/\/[^/"]+)/g)],
  ...[...html.matchAll(/<meta property="og:(?:url|image)" content="(https?:\/\/[^/"]+)/g)],
  ...[...lire('public/sitemap.xml').matchAll(/<loc>(https?:\/\/[^/<]+)/g)],
  ...[...lire('public/robots.txt').matchAll(/Sitemap:\s*(https?:\/\/[^/\s]+)/g)],
]
for (const m of releve) domaines.add(m[1]!)

if (releve.length < 5) {
  erreurs.push(`domaine : ${releve.length} mention(s) trouvée(s), 5 attendues — le relevé a dû rater un fichier`)
}
if (domaines.size > 1) {
  erreurs.push(`domaine : plusieurs origines annoncées — ${[...domaines].join(', ')}`)
}

// --- Rapport ----------------------------------------------------------------

console.log(`i18n : ${fr.size} clés fr, ${en.size} clés en.`)
console.log(`crédits : ${credites.size} lignes pour ${recettes.filter((r) => r.image).length} recettes avec photo.`)
console.log(`domaine : ${[...domaines].join(', ')} (${releve.length} mentions).`)

if (erreurs.length) {
  console.log('')
  for (const e of erreurs) console.log(`  erreur  ${e}`)
  console.log(`\n${erreurs.length} erreur(s).`)
  process.exit(1)
}
console.log('\nInvariants tenus.')

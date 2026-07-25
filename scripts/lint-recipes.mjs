#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const racine = join(dirname(fileURLToPath(import.meta.url)), '..')
const recipes = JSON.parse(readFileSync(join(racine, 'src/data/recipes.json'), 'utf8'))

const UNITS = ['g', 'kg', 'ml', 'cl', 'l', 'cs', 'cc', 'pincee', 'piece', 'botte']
const STORES = ['intermarche', 'primeur']

const erreurs = []
const avertissements = []
const variantes = []

// --- Validation de structure ------------------------------------------------

const ids = new Set()
for (const [i, r] of recipes.entries()) {
  const ou = `recette #${i} (${r.titre ?? 'sans titre'})`

  if (!r.id) erreurs.push(`${ou} : id manquant`)
  else if (ids.has(r.id)) erreurs.push(`${ou} : id en double « ${r.id} »`)
  else ids.add(r.id)

  if (!r.titre) erreurs.push(`${ou} : titre manquant`)
  if (!Number.isFinite(r.temps)) erreurs.push(`${ou} : temps manquant ou non numérique`)
  if (!Number.isFinite(r.portions) || r.portions < 1) erreurs.push(`${ou} : portions invalides`)
  if (!Array.isArray(r.tags) || r.tags.length === 0) avertissements.push(`${ou} : aucun tag`)
  if (!Array.isArray(r.etapes) || r.etapes.length === 0) erreurs.push(`${ou} : aucune étape`)

  for (const ing of r.ingredients ?? []) {
    const oui = `${ou} → « ${ing.nom} »`
    if (!ing.nom) erreurs.push(`${ou} : ingrédient sans nom`)
    if (!Number.isFinite(ing.quantite) || ing.quantite <= 0) erreurs.push(`${oui} : quantité invalide`)
    if (!UNITS.includes(ing.unite)) erreurs.push(`${oui} : unité inconnue « ${ing.unite} »`)
    if (!STORES.includes(ing.magasin)) erreurs.push(`${oui} : magasin inconnu « ${ing.magasin} »`)
  }
  if (!r.ingredients?.length) erreurs.push(`${ou} : aucun ingrédient`)
}

// --- Cohérence du vocabulaire ----------------------------------------------

const noms = [...new Set(recipes.flatMap((r) => (r.ingredients ?? []).map((i) => i.nom)))].sort()

const normaliser = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z ]/g, '')
    .replace(/s\b/g, '')
    .trim()

function distance(a, b) {
  const m = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 0; j <= b.length; j++) m[0][j] = j
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      m[i][j] = Math.min(
        m[i - 1][j] + 1,
        m[i][j - 1] + 1,
        m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
  return m[a.length][b.length]
}

for (let i = 0; i < noms.length; i++) {
  for (let j = i + 1; j < noms.length; j++) {
    const a = normaliser(noms[i])
    const b = normaliser(noms[j])
    if (a === b) {
      avertissements.push(`vocabulaire : « ${noms[i]} » et « ${noms[j]} » sont le même nom`)
      continue
    }

    const court = Math.min(a.length, b.length)
    // Sous 5 lettres, « ail » et « sel » sont à distance 2 : inexploitable.
    if (court < 5) continue

    const seuil = court >= 8 ? 2 : 1
    if (distance(a, b) <= seuil) {
      avertissements.push(`vocabulaire : « ${noms[i]} » et « ${noms[j]} » — même ingrédient ?`)
      continue
    }

    // « crème fraîche » / « crème fraîche épaisse » est un doublon à
    // fusionner ; « oignon » / « oignon nouveau » est légitime. Rien
    // dans les chaînes ne les distingue, donc on liste sans juger.
    if (a.includes(b) || b.includes(a)) {
      variantes.push(`« ${noms[i]} » ⊂ « ${noms[j]} »`)
    }
  }
}

// Un ingrédient rangé dans deux magasins différents selon la recette.
const magasinParNom = new Map()
for (const r of recipes)
  for (const ing of r.ingredients ?? []) {
    const connu = magasinParNom.get(ing.nom)
    if (connu && connu !== ing.magasin) {
      avertissements.push(`magasin : « ${ing.nom} » est tantôt ${connu}, tantôt ${ing.magasin}`)
    } else magasinParNom.set(ing.nom, ing.magasin)
  }

// --- Rapport ----------------------------------------------------------------

console.log(`${recipes.length} recettes, ${noms.length} ingrédients distincts.\n`)

for (const a of [...new Set(avertissements)]) console.log(`  avertissement  ${a}`)
for (const e of erreurs) console.log(`  erreur         ${e}`)

if (variantes.length) {
  console.log('\nNoms qui se contiennent — à fusionner ou à laisser, au cas par cas :')
  for (const v of [...new Set(variantes)]) console.log(`  ${v}`)
}

if (erreurs.length) {
  console.log(`\n${erreurs.length} erreur(s). Le corpus n'est pas exploitable en l'état.`)
  process.exit(1)
}
console.log(avertissements.length ? '\nAucune erreur bloquante.' : '\nCorpus propre.')

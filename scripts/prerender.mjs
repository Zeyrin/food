#!/usr/bin/env node
/**
 * Le catalogue en HTML statique, écrit dans `dist/` après `vite build`.
 *
 * L'app est une SPA à une seule URL : les 137 recettes vivent dans une pile
 * d'écrans React, jamais dans une adresse. Personne ne peut donc arriver sur
 * « dahl de lentilles corail » depuis un moteur de recherche, ni envoyer un
 * plat précis à quelqu'un — le seul lien partageable est la racine.
 *
 * Ce script donne à chaque recette une page à elle, avec son contenu réel
 * (photo, ingrédients, étapes) et ses métadonnées. Ces pages sont autonomes :
 * pas de bundle, pas de React, rien à hydrater. Elles se lisent telles quelles
 * et renvoient vers l'app pour ce que l'app sait faire — ajuster les parts,
 * agréger la liste, lancer les minuteurs.
 *
 * Elles tournent après `vite build` à dessein : le service worker est généré
 * pendant le build, donc ces fichiers n'existent pas encore quand Workbox
 * calcule son manifeste. Les 137 pages restent hors du précache, et le poids
 * hors ligne de l'app ne bouge pas.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const racine = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(racine, 'dist')
const recipes = JSON.parse(readFileSync(join(racine, 'src/data/recipes.json'), 'utf8'))

/** Doit rester identique au `canonical` de index.html et au sitemap. */
const SITE = 'https://www.fffood.fr'

/**
 * Le même identifiant de site que l'app : ces pages sont une porte d'entrée,
 * et on veut pouvoir répondre à « est-ce que quelqu'un arrive par là ».
 */
const ANALYTICS =
  '<script src="https://app.rybbit.io/api/script.js" data-site-id="4c5badb87633" defer></script>'

// --- Rendu des quantités ----------------------------------------------------

/**
 * Les suffixes d'unités, en français seulement. `formatQuantite`
 * (src/lib/aggregate.ts) fait la même chose dans l'app, mais en lisant la
 * langue courante — une notion qui n'existe pas au build, où chaque page est
 * écrite une fois pour toutes. Le corpus est écrit en français et le site est
 * servi sur un .fr : ces pages le sont aussi. `scripts/lint-recipes.mjs`
 * redéclare `UNITS` et `RAYONS` pour la même raison.
 */
const SUFFIXE = {
  cs: () => 'c. à s.',
  cc: () => 'c. à c.',
  pincee: (n) => (n > 1 ? 'pincées' : 'pincée'),
  botte: (n) => (n > 1 ? 'bottes' : 'botte'),
  piece: () => '',
}

const FRACTIONS = { 0.25: '¼', 0.5: '½', 0.75: '¾' }

function formatNombre(n) {
  const entier = Math.floor(n)
  const fraction = FRACTIONS[+(n - entier).toFixed(2)]
  if (fraction) return entier > 0 ? `${entier}${fraction}` : fraction
  return String(n).replace('.', ',')
}

function formatQuantite(ing) {
  const suffixe = SUFFIXE[ing.unite]?.(ing.quantite) ?? ing.unite
  return `${formatNombre(ing.quantite)} ${suffixe}`.trim()
}

/** « 250 g de lentilles corail », mais « 3 ail » n'a pas de « de ». */
function ligneIngredient(ing) {
  const quantite = formatQuantite(ing)
  return quantite ? `${quantite} ${ing.nom}` : ing.nom
}

// --- Échappement ------------------------------------------------------------

const ECHAPPE = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ECHAPPE[c])

// --- Métadonnées ------------------------------------------------------------

/**
 * Une description qui dit ce qu'on va trouver. Les ingrédients principaux y
 * sont parce que c'est souvent par eux qu'on cherche un plat (« que faire avec
 * des lentilles corail »), et parce qu'ils distinguent deux currys là où
 * « recette de curry, 30 min » ne distingue rien.
 */
function description(r) {
  const tetes = r.ingredients
    .filter((i) => !i.placard)
    .slice(0, 4)
    .map((i) => i.nom)
  const debut = `${r.titre} : recette pour ${r.portions} ${r.portions > 1 ? 'personnes' : 'personne'}, prête en ${r.temps} min.`
  if (tetes.length === 0) return `${debut} Ingrédients, quantités et étapes.`
  // Les noms canoniques sont en minuscules (« tofu soyeux ») ; en tête de
  // phrase, ça se lit comme une coquille dans un résultat de recherche.
  const liste = tetes.join(', ').replace(/^./, (c) => c.toUpperCase())
  return `${debut} ${liste}. Ingrédients, quantités et étapes.`
}

const urlRecette = (r) => `${SITE}/recette/${r.id}/`
const urlImage = (r) => (r.image ? `${SITE}${r.image}` : `${SITE}/icon-512.png`)

/**
 * Le balisage que les moteurs lisent pour afficher une recette autrement
 * qu'un lien bleu : durée, photo, nombre de parts, liste d'ingrédients.
 * C'est la seule raison pour laquelle une page de recette peut sortir en
 * résultat enrichi.
 */
function jsonLd(r) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: r.titre,
    description: description(r),
    url: urlRecette(r),
    ...(r.image ? { image: [urlImage(r)] } : {}),
    totalTime: `PT${r.temps}M`,
    recipeYield: `${r.portions} portions`,
    keywords: r.tags.join(', '),
    recipeIngredient: r.ingredients.map(ligneIngredient),
    recipeInstructions: r.etapes.map((texte, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      text: texte,
    })),
  }).replace(/</g, '\\u003c')
}

// --- Gabarit ----------------------------------------------------------------

/**
 * Le style est en ligne : une page de recette doit s'afficher en un aller-
 * retour réseau, et la feuille de l'app (`src/styles.css`) est écrite pour
 * des composants qui ne sont pas ici. Les couleurs et les polices, elles,
 * sont bien celles de l'app — on arrive chez FFFood, pas sur un document.
 */
const STYLE = `
:root{--papier:#fff8ef;--carte:#fff;--carte-basse:#fdf3da;--encre:#201b0c;--encre-douce:#43493c;--trait:#c3c9b8;--accent:#385e16;--accent-doux:#cefda3;--sur-accent:#fff;--rayon:24px}
@media (prefers-color-scheme:dark){:root{--papier:#16150f;--carte:#201e17;--carte-basse:#262319;--encre:#f3f0e6;--encre-douce:#b8bcae;--trait:#3a3d31;--accent:#a6d47e;--accent-doux:#2b5008;--sur-accent:#0c2000}}
@font-face{font-family:'Bricolage Grotesque';font-weight:700;font-display:swap;src:url('/fonts/bricolage-700.ttf') format('truetype')}
@font-face{font-family:'Hanken Grotesk';font-weight:400;font-display:swap;src:url('/fonts/hanken-400.ttf') format('truetype')}
@font-face{font-family:'Hanken Grotesk';font-weight:600;font-display:swap;src:url('/fonts/hanken-600.ttf') format('truetype')}
*{box-sizing:border-box}
body{margin:0;background:var(--papier);color:var(--encre);font-family:'Hanken Grotesk',ui-sans-serif,system-ui,sans-serif;font-size:17px;line-height:1.6}
main,header.site{max-width:44rem;margin:0 auto;padding:0 1.25rem}
header.site{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding-top:1.25rem;padding-bottom:1.25rem}
header.site a.marque{font-family:'Bricolage Grotesque',ui-sans-serif,system-ui,sans-serif;font-weight:700;font-size:1.25rem;color:var(--encre);text-decoration:none}
h1{font-family:'Bricolage Grotesque',ui-sans-serif,system-ui,sans-serif;font-weight:700;font-size:clamp(1.9rem,6vw,2.6rem);line-height:1.15;margin:.5rem 0}
h2{font-family:'Bricolage Grotesque',ui-sans-serif,system-ui,sans-serif;font-weight:700;font-size:1.3rem;margin:2.5rem 0 .75rem}
a{color:var(--accent)}
.meta{color:var(--encre-douce);margin:0 0 1.25rem}
.tags{display:flex;flex-wrap:wrap;gap:.5rem;list-style:none;padding:0;margin:0 0 1.5rem}
.tags li{background:var(--carte-basse);border-radius:999px;padding:.2rem .75rem;font-size:.9rem;color:var(--encre-douce)}
img.plat{width:100%;height:auto;aspect-ratio:4/3;object-fit:cover;border-radius:var(--rayon);background:var(--carte-basse)}
ul.ingredients{list-style:none;padding:0;margin:0}
ul.ingredients li{display:flex;justify-content:space-between;gap:1rem;padding:.6rem .9rem;border-bottom:1px solid var(--trait)}
ul.ingredients li:last-child{border-bottom:0}
ul.ingredients .q{color:var(--encre-douce);white-space:nowrap}
ul.ingredients li.placard .q::after{content:' · placard';font-size:.85em}
ol.etapes{padding-left:1.4rem;margin:0}
ol.etapes li{margin-bottom:1rem;padding-left:.25rem}
.cta{display:block;background:var(--accent);color:var(--sur-accent);text-decoration:none;text-align:center;font-weight:600;padding:1rem;border-radius:var(--rayon);margin:2.5rem 0 0}
.cta span{display:block;font-weight:400;font-size:.9rem;opacity:.85;margin-top:.25rem}
ul.liens{list-style:none;padding:0;margin:0;display:grid;gap:.5rem}
ul.liens a{display:block;background:var(--carte);border:1px solid var(--trait);border-radius:16px;padding:.75rem 1rem;text-decoration:none;color:var(--encre)}
ul.liens .q{display:block;color:var(--encre-douce);font-size:.9rem}
footer{max-width:44rem;margin:0 auto;padding:3rem 1.25rem;color:var(--encre-douce);font-size:.9rem}
`.trim()

function page({ titre, desc, url, image, largeImage, corps, jsonld }) {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#385e16">
<title>${esc(titre)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="FFFood">
<meta property="og:url" content="${esc(url)}">
<meta property="og:title" content="${esc(titre)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(image)}">
<meta name="twitter:card" content="${largeImage ? 'summary_large_image' : 'summary'}">
<meta name="twitter:title" content="${esc(titre)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(image)}">
<link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png">
<link rel="apple-touch-icon" href="/icon-192.png">
${jsonld ? `<script type="application/ld+json">${jsonld}</script>` : ''}
<style>${STYLE}</style>
${ANALYTICS}
</head>
<body>
<header class="site">
  <a class="marque" href="/">FFFood</a>
  <a href="/recette/">Toutes les recettes</a>
</header>
${corps}
<footer>
  <p>FFFood — les repas de la semaine, la liste de courses et le mode cuisson.
  Sans compte, gratuit, utilisable hors ligne en magasin.</p>
  <p><a href="/credits.html">Crédits photo</a></p>
</footer>
</body>
</html>
`
}

// --- Pages de recette -------------------------------------------------------

/**
 * Trois plats qui partagent un tag. Une page isolée que rien ne relie au reste
 * est une page que rien ne fait explorer — ni un robot, ni quelqu'un qui vient
 * d'arriver et à qui ce plat-là ne dit rien.
 */
function voisines(r) {
  const tags = new Set(r.tags)
  return recipes
    .filter((autre) => autre.id !== r.id && autre.tags.some((t) => tags.has(t)))
    .slice(0, 3)
}

function pageRecette(r) {
  const proches = voisines(r)
  const corps = `<main>
  ${r.image ? `<img class="plat" src="${esc(r.image)}" width="800" height="600" alt="${esc(r.titre)}">` : ''}
  <h1>${esc(r.titre)}</h1>
  <p class="meta">${r.temps} min · ${r.portions} ${r.portions > 1 ? 'personnes' : 'personne'} · ${r.ingredients.length} ingrédients</p>
  ${
    r.tags.length > 0
      ? `<ul class="tags">${r.tags.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`
      : ''
  }

  <h2>Ingrédients</h2>
  <ul class="ingredients">
${r.ingredients
  .map((ing) => {
    const q = formatQuantite(ing)
    return `    <li${ing.placard ? ' class="placard"' : ''}><span>${esc(ing.nom)}</span><span class="q">${esc(q)}</span></li>`
  })
  .join('\n')}
  </ul>

  <h2>Préparation</h2>
  <ol class="etapes">
${r.etapes.map((e) => `    <li>${esc(e)}</li>`).join('\n')}
  </ol>

  <a class="cta" href="/#/r/${esc(r.id)}">Ouvrir ${esc(r.titre)} dans FFFood
    <span>Ajustez les parts, ajoutez le plat à la liste de courses, cuisinez pas à pas.</span></a>
${
  proches.length > 0
    ? `
  <h2>Dans le même esprit</h2>
  <ul class="liens">
${proches
  .map(
    (a) =>
      `    <li><a href="/recette/${esc(a.id)}/">${esc(a.titre)}<span class="q">${a.temps} min · ${esc(a.tags.slice(0, 2).join(', '))}</span></a></li>`,
  )
  .join('\n')}
  </ul>`
    : ''
}
</main>`

  return page({
    titre: `${r.titre} — recette en ${r.temps} min | FFFood`,
    desc: description(r),
    url: urlRecette(r),
    image: urlImage(r),
    largeImage: Boolean(r.image),
    corps,
    jsonld: jsonLd(r),
  })
}

// --- Index du catalogue -----------------------------------------------------

function pageIndex() {
  const tries = [...recipes].sort((a, b) => a.titre.localeCompare(b.titre, 'fr'))
  const corps = `<main>
  <h1>Toutes les recettes</h1>
  <p class="meta">${tries.length} recettes, écrites à la main. Ingrédients, quantités et étapes.</p>
  <ul class="liens">
${tries
  .map(
    (r) =>
      `    <li><a href="/recette/${esc(r.id)}/">${esc(r.titre)}<span class="q">${r.temps} min · ${r.portions} pers.${r.tags.length ? ` · ${esc(r.tags.slice(0, 3).join(', '))}` : ''}</span></a></li>`,
  )
  .join('\n')}
  </ul>
  <a class="cta" href="/">Ouvrir FFFood
    <span>Choisissez vos repas de la semaine, la liste de courses se remplit toute seule.</span></a>
</main>`

  return page({
    titre: `Toutes les recettes — ${tries.length} plats | FFFood`,
    desc: `Le catalogue FFFood : ${tries.length} recettes avec ingrédients, quantités et étapes. Choisissez vos repas de la semaine, la liste de courses s'en déduit.`,
    url: `${SITE}/recette/`,
    image: `${SITE}/icon-512.png`,
    largeImage: false,
    corps,
    jsonld: null,
  })
}

// --- Sitemap ----------------------------------------------------------------

/**
 * Généré ici plutôt que posé dans `public/` : un sitemap écrit à la main
 * ignore les recettes ajoutées depuis, et se serait périmé au premier commit
 * de corpus.
 */
function sitemap() {
  const urls = [
    { loc: `${SITE}/`, priority: '1.0' },
    { loc: `${SITE}/recette/`, priority: '0.8' },
    ...recipes.map((r) => ({ loc: urlRecette(r), priority: '0.6' })),
  ]
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url>\n    <loc>${u.loc}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`,
  )
  .join('\n')}
</urlset>
`
}

// --- Écriture ---------------------------------------------------------------

function ecrire(chemin, contenu) {
  const complet = join(dist, chemin)
  mkdirSync(dirname(complet), { recursive: true })
  writeFileSync(complet, contenu)
}

for (const r of recipes) ecrire(`recette/${r.id}/index.html`, pageRecette(r))
ecrire('recette/index.html', pageIndex())
ecrire('sitemap.xml', sitemap())

console.log(`Prérendu : ${recipes.length} recettes + l'index, et le sitemap.`)

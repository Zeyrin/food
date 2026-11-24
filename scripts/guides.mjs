#!/usr/bin/env node
/**
 * Les guides : des articles écrits à la main (`src/data/guides/*.md`) qui
 * répondent à une question qu'on tape dans un moteur de recherche — « menu
 * de la semaine », « que manger ce soir » — avec les plats du catalogue.
 *
 * Une page de recette ne se trouve que si l'on cherche déjà ce plat-là. Un
 * guide se trouve quand on ne sait pas encore quoi cuisiner, ce qui est
 * exactement le moment où FFFood sert. Chaque guide renvoie vers les
 * recettes qu'il cite, chaque recette renvoie vers les guides qui la citent,
 * et le menu d'un guide s'ajoute au panier en un lien (`/menu/#/m/…`).
 *
 * Ce module lit et valide les guides ; `prerender.mjs` les écrit. Lancé
 * seul (`npm run lint:guides`), il valide sans rien construire : c'est ce
 * qu'on fait après avoir écrit un guide, avant le build complet.
 *
 * Le format, volontairement petit :
 *
 *   ---
 *   titre: Le titre affiché en tête de page
 *   titre_seo: Le <title>, 60 caractères au plus (facultatif)
 *   description: L'extrait sous le lien dans Google, 160 caractères au plus
 *   mot_cle: la requête visée, en minuscules
 *   publie: 2026-11-24
 *   mis_a_jour: 2026-12-01 (facultatif)
 *   menu: dahl-lentilles-corail:4, shakshuka:4 (facultatif)
 *   ---
 *
 * Le corps est du Markdown réduit à ce dont un article a besoin : `##` et
 * `###`, paragraphes, listes à puces ou numérotées, **gras**, *italique*,
 * [liens](/recette/…/). Deux blocs en plus, seuls sur leur ligne :
 * `{{recette mapo-tofu}}` pose la carte d'un plat du catalogue, `{{menu}}`
 * le bouton qui met le menu entier dans le panier. Pas de HTML brut : tout
 * est échappé, un guide ne peut rien injecter dans la page.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const racine = join(dirname(fileURLToPath(import.meta.url)), '..')
const DOSSIER = join(racine, 'src/data/guides')

export const TITRE_SEO_MAX = 60
export const DESCRIPTION_MAX = 160
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const DATE = /^\d{4}-\d{2}-\d{2}$/
const BLOC_RECETTE = /^\{\{recette ([a-z0-9-]+)\}\}$/
const BLOC_MENU = /^\{\{menu\}\}$/

const ECHAPPE = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ECHAPPE[c])

// --- Lecture ---------------------------------------------------------------

function lireEntete(texte, fichier) {
  const m = texte.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!m) throw new Error(`${fichier} : en-tête --- manquant`)
  const champs = {}
  for (const ligne of m[1].split('\n')) {
    if (!ligne.trim()) continue
    const i = ligne.indexOf(':')
    if (i < 0) throw new Error(`${fichier} : ligne d'en-tête illisible « ${ligne} »`)
    champs[ligne.slice(0, i).trim()] = ligne.slice(i + 1).trim()
  }
  return { champs, corps: m[2] }
}

function lireMenu(valeur) {
  if (!valeur) return []
  return valeur.split(',').map((morceau) => {
    const [id, parts] = morceau.trim().split(':')
    return { id, portions: Number(parts) || 0 }
  })
}

/** Tous les guides, du plus récent au plus ancien. */
export function lireGuides() {
  let fichiers = []
  try {
    fichiers = readdirSync(DOSSIER).filter((f) => f.endsWith('.md'))
  } catch {
    return []
  }
  return fichiers
    .map((fichier) => {
      const { champs, corps } = lireEntete(readFileSync(join(DOSSIER, fichier), 'utf8'), fichier)
      return {
        fichier,
        slug: fichier.replace(/\.md$/, ''),
        titre: champs.titre,
        titreSeo: champs.titre_seo || `${champs.titre} | FFFood`,
        description: champs.description,
        motCle: champs.mot_cle,
        publie: champs.publie,
        misAJour: champs.mis_a_jour || champs.publie,
        menu: lireMenu(champs.menu),
        corps,
      }
    })
    .sort((a, b) => b.publie.localeCompare(a.publie) || a.slug.localeCompare(b.slug))
}

// --- Validation ------------------------------------------------------------

/**
 * Ce qui casserait la page ou la ferait mal classer. Un guide qui cite une
 * recette renommée doit échouer au build, pas publier une carte vide.
 */
export function validerGuides(guides, recipes) {
  const ids = new Set(recipes.map((r) => r.id))
  const erreurs = []
  const motsCles = new Map()
  for (const g of guides) {
    const ou = g.fichier
    if (!SLUG.test(g.slug)) erreurs.push(`${ou} : nom de fichier hors format (minuscules, chiffres, tirets)`)
    for (const champ of ['titre', 'description', 'mot_cle', 'publie']) {
      const cle = { mot_cle: 'motCle' }[champ] ?? champ
      if (!g[cle]) erreurs.push(`${ou} : champ « ${champ} » manquant`)
    }
    if (g.publie && !DATE.test(g.publie)) erreurs.push(`${ou} : « publie » doit être AAAA-MM-JJ`)
    if (g.misAJour && !DATE.test(g.misAJour)) erreurs.push(`${ou} : « mis_a_jour » doit être AAAA-MM-JJ`)
    if (g.titreSeo.length > TITRE_SEO_MAX)
      erreurs.push(`${ou} : titre de page de ${g.titreSeo.length} caractères (max ${TITRE_SEO_MAX}), ajoutez un titre_seo plus court`)
    if (g.description && g.description.length > DESCRIPTION_MAX)
      erreurs.push(`${ou} : description de ${g.description.length} caractères (max ${DESCRIPTION_MAX})`)
    // Deux guides sur la même requête se font concurrence dans Google :
    // mieux vaut enrichir le premier.
    if (g.motCle) {
      const k = g.motCle.toLowerCase()
      if (motsCles.has(k)) erreurs.push(`${ou} : même mot-clé que ${motsCles.get(k)} (« ${k} »)`)
      motsCles.set(k, ou)
    }
    for (const p of g.menu) {
      if (!ids.has(p.id)) erreurs.push(`${ou} : menu, recette inconnue « ${p.id} »`)
      if (!(p.portions >= 1 && p.portions <= 50)) erreurs.push(`${ou} : menu, parts invalides pour « ${p.id} »`)
    }
    if (g.menu.length > 21) erreurs.push(`${ou} : menu de plus de 21 plats, le lien les ignorerait`)
    for (const id of recettesCitees(g)) if (!ids.has(id)) erreurs.push(`${ou} : recette inconnue « ${id} »`)
    if (BLOC_MENU_DANS(g.corps) && g.menu.length === 0) erreurs.push(`${ou} : {{menu}} sans champ « menu »`)
    for (const m of g.corps.matchAll(/\]\((\/recette\/([^/)]+)\/?)\)/g))
      if (!ids.has(m[2])) erreurs.push(`${ou} : lien vers une recette inconnue « ${m[1]} »`)
    for (const m of g.corps.matchAll(/\]\(\/guides\/([^/)]+)\/?\)/g))
      if (!guides.some((x) => x.slug === m[1])) erreurs.push(`${ou} : lien vers un guide inconnu « ${m[1]} »`)
    if (/<[a-z/!]/i.test(g.corps)) erreurs.push(`${ou} : HTML dans le corps, il serait affiché tel quel`)
  }
  return erreurs
}

const BLOC_MENU_DANS = (corps) => corps.split('\n').some((l) => BLOC_MENU.test(l.trim()))

/** Les recettes qu'un guide montre ou lie, dans l'ordre où elles apparaissent. */
export function recettesCitees(g) {
  const ids = []
  for (const ligne of g.corps.split('\n')) {
    const bloc = ligne.trim().match(BLOC_RECETTE)
    if (bloc) ids.push(bloc[1])
    for (const m of ligne.matchAll(/\]\(\/recette\/([^/)]+)\/?\)/g)) ids.push(m[1])
  }
  for (const p of g.menu) ids.push(p.id)
  return [...new Set(ids)]
}

// --- Rendu -----------------------------------------------------------------

/** Gras, italique, liens. Le texte est échappé avant, les balises posées après. */
function enLigne(texte) {
  return esc(texte)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, href) => {
      // Seuls les liens internes ou https passent : pas de javascript:.
      const sur = /^(\/|https:\/\/)/.test(href) ? href : '#'
      return `<a href="${sur}">${t}</a>`
    })
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
}

/**
 * Le corps en HTML. `carte(id)` et `boutonMenu()` viennent de l'appelant :
 * ce sont eux qui savent à quoi ressemble une recette sur le site.
 */
export function rendreCorps(corps, { carte, boutonMenu }) {
  const sortie = []
  let paragraphe = []
  let liste = null

  const fermer = () => {
    if (paragraphe.length) sortie.push(`<p>${enLigne(paragraphe.join(' '))}</p>`)
    paragraphe = []
    if (liste) sortie.push(`<${liste.type}>${liste.items.map((i) => `<li>${enLigne(i)}</li>`).join('')}</${liste.type}>`)
    liste = null
  }

  for (const brute of corps.split('\n')) {
    const ligne = brute.trim()
    let m
    if (!ligne) fermer()
    else if ((m = ligne.match(BLOC_RECETTE))) (fermer(), sortie.push(carte(m[1])))
    else if (BLOC_MENU.test(ligne)) (fermer(), sortie.push(boutonMenu()))
    else if ((m = ligne.match(/^(#{2,3}) (.+)$/))) {
      fermer()
      const n = m[1].length
      sortie.push(`<h${n}>${enLigne(m[2])}</h${n}>`)
    } else if ((m = ligne.match(/^(-|\d+\.) (.+)$/))) {
      const type = m[1] === '-' ? 'ul' : 'ol'
      if (paragraphe.length || (liste && liste.type !== type)) fermer()
      liste ??= { type, items: [] }
      liste.items.push(m[2])
    } else if (liste) {
      // Une ligne qui suit une puce sans en être une la prolonge.
      liste.items[liste.items.length - 1] += ` ${ligne}`
    } else paragraphe.push(ligne)
  }
  fermer()
  return sortie.join('\n')
}

/** Le lien qui remplit le panier avec le menu du guide (voir src/lib/menuPartage.ts). */
export function lienMenu(SITE, menu) {
  return `${SITE}/menu/#/m/${menu.map((p) => `${p.id}:${p.portions}`).join(',')}`
}

// --- Lancé seul : validation ------------------------------------------------

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const recipes = JSON.parse(readFileSync(join(racine, 'src/data/recipes.json'), 'utf8'))
  const guides = lireGuides()
  const erreurs = validerGuides(guides, recipes)
  for (const e of erreurs) console.error(`✗ ${e}`)
  if (erreurs.length) process.exit(1)
  console.log(`Guides : ${guides.length} valides.`)
}

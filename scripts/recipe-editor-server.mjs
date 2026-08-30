// Petit serveur local pour éditer le corpus sans passer par un IDE : ouvre une
// page qui liste les 137 recettes avec leur photo, sauvegarde chaque champ
// directement dans src/data/recipes.json / recipes.en.json à la frappe, et
// écrit une photo déposée directement dans public/plats/<id>.webp (convertie
// et recadrée côté navigateur, avant l'envoi). Rien de ceci ne fait partie du
// build ni du dépôt de prod — outil de travail uniquement.
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { exec } from 'node:child_process'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const recipesPath = path.join(root, 'src/data/recipes.json')
const recipesEnPath = path.join(root, 'src/data/recipes.en.json')
const platsDir = path.join(root, 'public/plats')
const htmlPath = path.join(root, 'scripts/recipe-editor.html')

const PORT = 5561

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}
function writeJson(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n', 'utf8')
}
function sendJson(res, status, body) {
  const buf = Buffer.from(JSON.stringify(body))
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': buf.length })
  res.end(buf)
}
function collectBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`)

    if (req.method === 'GET' && url.pathname === '/') {
      const html = fs.readFileSync(htmlPath, 'utf8')
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(html)
      return
    }

    if (req.method === 'GET' && url.pathname === '/api/data') {
      const recipes = readJson(recipesPath)
      const en = readJson(recipesEnPath)
      const images = new Set(fs.readdirSync(platsDir).map((f) => f.replace(/\.webp$/, '')))
      sendJson(res, 200, { recipes, en, images: [...images] })
      return
    }

    if (req.method === 'PATCH' && url.pathname === '/api/recipe') {
      const body = JSON.parse((await collectBody(req)).toString('utf8'))
      const { id, fr, en } = body
      const recipes = readJson(recipesPath)
      const idx = recipes.findIndex((r) => r.id === id)
      if (idx === -1) return sendJson(res, 404, { error: 'recette introuvable' })
      recipes[idx] = { ...fr, id }
      writeJson(recipesPath, recipes)

      if (en) {
        const allEn = readJson(recipesEnPath)
        allEn[id] = en
        writeJson(recipesEnPath, allEn)
      }
      sendJson(res, 200, { ok: true })
      return
    }

    if (req.method === 'POST' && url.pathname === '/api/image') {
      const id = url.searchParams.get('id')
      if (!id) return sendJson(res, 400, { error: 'id manquant' })
      const buf = await collectBody(req)
      if (buf.length === 0) return sendJson(res, 400, { error: 'image vide' })
      fs.writeFileSync(path.join(platsDir, `${id}.webp`), buf)
      sendJson(res, 200, { ok: true })
      return
    }

    if (req.method === 'DELETE' && url.pathname === '/api/image') {
      const id = url.searchParams.get('id')
      if (!id) return sendJson(res, 400, { error: 'id manquant' })
      const p = path.join(platsDir, `${id}.webp`)
      if (fs.existsSync(p)) fs.unlinkSync(p)
      sendJson(res, 200, { ok: true })
      return
    }

    if (req.method === 'GET' && url.pathname.startsWith('/plats/')) {
      const file = path.join(platsDir, path.basename(url.pathname))
      if (!fs.existsSync(file)) return sendJson(res, 404, { error: 'introuvable' })
      const buf = fs.readFileSync(file)
      res.writeHead(200, { 'Content-Type': 'image/webp', 'Cache-Control': 'no-cache', 'Content-Length': buf.length })
      res.end(buf)
      return
    }

    sendJson(res, 404, { error: 'route inconnue' })
  } catch (err) {
    console.error(err)
    sendJson(res, 500, { error: String(err?.message ?? err) })
  }
})

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}`
  console.log(`Éditeur de recettes : ${url}`)
  console.log('Chaque champ sauvegarde directement dans src/data/recipes*.json et public/plats/.')
  const opener = process.platform === 'win32' ? 'start ""' : process.platform === 'darwin' ? 'open' : 'xdg-open'
  exec(`${opener} ${url}`)
})

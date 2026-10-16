/**
 * Fonction serveur Vercel : télécharge la page d'une recette et en renvoie
 * le contenu schema.org (voir `src/lib/jsonLdRecette.ts`).
 *
 * Elle existe parce qu'un navigateur n'a pas le droit de lire la page d'un
 * autre site. Comme elle va chercher une adresse choisie par l'appelant,
 * elle ne doit pas servir à explorer le réseau interne : http(s) seulement,
 * adresses privées refusées (vérifiées après résolution DNS, et à chaque
 * redirection), taille et durée bornées.
 */
import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import { extraireRecetteJsonLd } from '../src/lib/jsonLdRecette.js'

interface Requete {
  method?: string
  query: Record<string, string | string[] | undefined>
}
interface Reponse {
  status(code: number): Reponse
  setHeader(nom: string, valeur: string): void
  json(corps: unknown): void
}

const TAILLE_MAX = 3_000_000
const REDIRECTIONS_MAX = 4

/** Adresses qui ne sont pas l'internet public : boucle locale, réseaux privés, link-local (métadonnées cloud). */
export function adressePrivee(adresse: string): boolean {
  const v4 = adresse.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i)?.[1] ?? adresse
  if (isIP(v4) === 4) {
    const [a, b] = v4.split('.').map(Number) as [number, number]
    return (
      a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) || a >= 224
    )
  }
  const v6 = adresse.toLowerCase()
  return v6 === '::' || v6 === '::1' || /^f[cd]/.test(v6) || /^fe[89ab]/.test(v6)
}

async function verifierHote(url: URL): Promise<void> {
  if (!/^https?:$/.test(url.protocol)) throw new Erreur(400, 'Adresse non valide.')
  const hote = url.hostname.replace(/^\[|\]$/g, '')
  if (hote === 'localhost' || hote.endsWith('.local') || hote.endsWith('.internal')) {
    throw new Erreur(400, 'Adresse non autorisée.')
  }
  const adresses = isIP(hote) ? [{ address: hote }] : await lookup(hote, { all: true }).catch(() => [])
  if (adresses.length === 0) throw new Erreur(502, 'Site introuvable.')
  if (adresses.some((a) => adressePrivee(a.address))) throw new Erreur(400, 'Adresse non autorisée.')
}

class Erreur extends Error {
  constructor(readonly code: number, message: string) {
    super(message)
  }
}

async function telecharger(depart: URL): Promise<string> {
  let url = depart
  for (let saut = 0; saut <= REDIRECTIONS_MAX; saut++) {
    await verifierHote(url)
    const reponse = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(8000),
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; FFFood recipe import)',
        accept: 'text/html,application/xhtml+xml',
        'accept-language': 'fr,en;q=0.8',
      },
    }).catch(() => {
      throw new Erreur(502, 'Le site ne répond pas.')
    })
    if (reponse.status >= 300 && reponse.status < 400) {
      const suite = reponse.headers.get('location')
      if (!suite) throw new Erreur(502, 'Redirection invalide.')
      url = new URL(suite, url)
      continue
    }
    if (!reponse.ok) throw new Erreur(502, `Le site a répondu ${reponse.status}.`)
    if (!/html|xml/i.test(reponse.headers.get('content-type') ?? '')) {
      throw new Erreur(422, "Cette adresse n'est pas une page web.")
    }
    // Lecture bornée : on s'arrête dès que la limite est franchie.
    const lecteur = reponse.body?.getReader()
    if (!lecteur) throw new Erreur(502, 'Page vide.')
    const morceaux: Uint8Array[] = []
    let total = 0
    for (;;) {
      const { done, value } = await lecteur.read()
      if (done) break
      total += value.length
      if (total > TAILLE_MAX) {
        await lecteur.cancel()
        throw new Erreur(422, 'Page trop volumineuse.')
      }
      morceaux.push(value)
    }
    return new TextDecoder().decode(Buffer.concat(morceaux))
  }
  throw new Erreur(502, 'Trop de redirections.')
}

export default async function handler(req: Requete, res: Reponse) {
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800')
  const brut = Array.isArray(req.query.url) ? req.query.url[0] : req.query.url
  try {
    if (req.method && req.method !== 'GET') throw new Erreur(405, 'Méthode non autorisée.')
    let url: URL
    try {
      url = new URL(brut ?? '')
    } catch {
      throw new Erreur(400, 'Adresse non valide.')
    }
    const recette = extraireRecetteJsonLd(await telecharger(url))
    if (!recette) {
      throw new Erreur(
        422,
        "Aucune recette lisible sur cette page. Essayez l'adresse de la recette elle-même, ou ajoutez-la à la main.",
      )
    }
    res.status(200).json(recette)
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store')
    const code = e instanceof Erreur ? e.code : 500
    res.status(code).json({ erreur: e instanceof Erreur ? e.message : 'Erreur inattendue.' })
  }
}

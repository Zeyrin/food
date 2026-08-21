import type { Recipe } from '../types'
import { validerRecette } from './validerRecette'

/**
 * Ce qu'une IA renvoie vraiment, par opposition à ce qu'on lui a
 * demandé. Le prompt réclame « du JSON brut, sans markdown » ; la
 * réponse arrive quand même entourée de ```json, précédée d'un
 * « Voici la recette ! » et suivie d'un « Bon appétit ». L'app
 * répondait « ce n'est pas du JSON valide » et laissait l'utilisateur
 * nettoyer à la main dans un champ de texte, sur un téléphone.
 *
 * On extrait donc le JSON du bruit autour, plutôt que d'exiger un
 * collage propre.
 */
function extraire(texte: string): string | null {
  const t = texte.trim()
  if (!t) return null

  // Bloc de code markdown : son contenu, quoi qu'il y ait autour.
  const bloc = t.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const brut = (bloc?.[1] ?? t).trim()

  // Sinon (ou en plus), du premier crochet/accolade au dernier de la
  // même famille : les phrases d'introduction et de conclusion tombent.
  const debut = brut.search(/[[{]/)
  if (debut === -1) return null
  const fin = brut.lastIndexOf(brut[debut] === '[' ? ']' : '}')
  return fin > debut ? brut.slice(debut, fin + 1) : null
}

export interface ResultatCollage {
  /** Les recettes valides, dans l'ordre du collage. */
  recettes: Recipe[]
  /** Ce qui a été refusé, prêt à afficher. Vide si tout est passé. */
  erreurs: string[]
  /**
   * Titres déjà présents au catalogue, écartés du lot. Ce n'est pas une
   * erreur — recoller la même réponse est un geste banal — mais il faut
   * le dire, sinon le catalogue se remplit de doublons en silence.
   */
  doublons: string[]
}

/** Comparaison de titres tolérante aux accents, à la casse, aux espaces. */
const normaliserTitre = (titre: string) =>
  titre
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()

/**
 * Un collage → zéro, une ou plusieurs recettes. Demander « 5 recettes
 * d'été » à une IA renvoie un tableau JSON : refuser tout ce qui n'est
 * pas un objet unique obligeait à découper la réponse à la main, cinq
 * fois. Les recettes valides passent même si l'une d'elles est
 * rejetée — reformuler une demande entière parce qu'une unité est mal
 * orthographiée coûte plus cher que d'ajouter la manquante ensuite.
 */
export function validerCollage(texte: string, titresExistants: string[] = []): ResultatCollage {
  const extrait = extraire(texte)
  if (extrait === null) {
    return { recettes: [], erreurs: ["Aucun JSON trouvé dans le texte collé."], doublons: [] }
  }

  let json: unknown
  try {
    json = JSON.parse(extrait)
  } catch {
    return {
      recettes: [],
      erreurs: [
        "Le JSON est incomplet ou mal formé — souvent une réponse d'IA coupée en route. Redemandez-la, ou collez-la en entier.",
      ],
      doublons: [],
    }
  }

  const liste = Array.isArray(json) ? json : [json]
  if (liste.length === 0) return { recettes: [], erreurs: ['La liste collée est vide.'], doublons: [] }

  const recettes: Recipe[] = []
  const erreurs: string[] = []
  const doublons: string[] = []
  // Les titres déjà vus, catalogue compris : un lot qui contient deux
  // fois le même plat ne doit pas non plus l'ajouter deux fois.
  const vus = new Set(titresExistants.map(normaliserTitre))

  liste.forEach((item, i) => {
    const resultat = validerRecette(item)
    if ('erreurs' in resultat) {
      // Le titre plutôt que l'indice quand il existe : dans un lot de
      // cinq, « Dahl de lentilles » se retrouve, « recette #3 » non.
      const nom = (item as { titre?: unknown })?.titre
      const etiquette =
        liste.length === 1 ? '' : `${typeof nom === 'string' && nom.trim() ? nom : `Recette #${i + 1}`} : `
      erreurs.push(...resultat.erreurs.map((e) => etiquette + e))
    } else if (vus.has(normaliserTitre(resultat.recette.titre))) {
      doublons.push(resultat.recette.titre)
    } else {
      vus.add(normaliserTitre(resultat.recette.titre))
      recettes.push(resultat.recette)
    }
  })

  return { recettes, erreurs, doublons }
}

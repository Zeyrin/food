import { RAYONS, UNITS, type RayonId, type Recipe } from '../types'
import { rayonDe } from './rayons'

const RAYONS_VALIDES = Object.keys(RAYONS) as RayonId[]

/**
 * Valide le JSON collé par l'utilisateur (généré par une IA à partir
 * du prompt-template). Mêmes règles que scripts/lint-recipes.mjs,
 * réduites à ce qui bloque vraiment l'usage — pas la détection de
 * vocabulaire similaire, inutile sur une recette isolée.
 */
export function validerRecette(json: unknown): { recette: Recipe } | { erreurs: string[] } {
  const erreurs: string[] = []

  if (typeof json !== 'object' || json === null) {
    return { erreurs: ["Ce n'est pas un objet JSON valide."] }
  }
  const r = json as Record<string, unknown>

  if (typeof r.titre !== 'string' || !r.titre.trim()) erreurs.push('« titre » manquant.')
  if (!Number.isFinite(r.temps) || (r.temps as number) <= 0) erreurs.push('« temps » doit être un nombre de minutes positif.')
  if (!Number.isFinite(r.portions) || (r.portions as number) < 1) erreurs.push('« portions » doit être un nombre ≥ 1.')
  if (!Array.isArray(r.tags)) erreurs.push('« tags » doit être une liste (peut être vide).')
  if (!Array.isArray(r.etapes) || r.etapes.length === 0) erreurs.push('« etapes » doit être une liste non vide de texte.')

  if (!Array.isArray(r.ingredients) || r.ingredients.length === 0) {
    erreurs.push('« ingredients » doit être une liste non vide.')
  } else {
    r.ingredients.forEach((ing, i) => {
      const oi = `ingrédient #${i + 1}`
      if (typeof ing !== 'object' || ing === null) {
        erreurs.push(`${oi} : n'est pas un objet.`)
        return
      }
      const x = ing as Record<string, unknown>
      if (typeof x.nom !== 'string' || !x.nom.trim()) erreurs.push(`${oi} : « nom » manquant.`)
      if (!Number.isFinite(x.quantite) || (x.quantite as number) <= 0) erreurs.push(`${oi} : « quantite » doit être un nombre positif.`)
      if (typeof x.unite !== 'string' || !UNITS.includes(x.unite as (typeof UNITS)[number])) {
        erreurs.push(`${oi} : « unite » doit être l'une de : ${UNITS.join(', ')}.`)
      }
      // Un ingrédient d'une recette écrite avant les rayons nomme un
      // magasin ; on le traduit plutôt que de refuser le collage.
      if (!RAYONS_VALIDES.includes(x.rayon as RayonId) && typeof x.magasin !== 'string') {
        erreurs.push(`${oi} : « rayon » doit être l'un de : ${RAYONS_VALIDES.join(', ')}.`)
      }
    })
  }

  if (erreurs.length > 0) return { erreurs }

  return {
    recette: {
      id: crypto.randomUUID(),
      titre: (r.titre as string).trim(),
      temps: r.temps as number,
      portions: r.portions as number,
      tags: r.tags as string[],
      // Le rayon est normalisé à l'entrée, une bonne fois : le reste de
      // l'app lit une recette moderne, sans avoir à connaître l'ancien
      // champ « magasin ».
      ingredients: (r.ingredients as Recipe['ingredients']).map((ing) => {
        // `magasin` est écarté au passage : la recette entre au format
        // du jour, l'ancien champ ne se recopie pas.
        const { magasin, ...reste } = ing
        return { ...reste, rayon: rayonDe({ rayon: reste.rayon, magasin }) }
      }),
      etapes: r.etapes as string[],
      ...(typeof r.image === 'string' && r.image ? { image: r.image } : {}),
      ...(typeof r.description === 'string' && r.description ? { description: r.description } : {}),
      ...(Array.isArray(r.astuces) ? { astuces: r.astuces as string[] } : {}),
    },
  }
}

import { MAGASINS_DE_RECETTE, UNITS, estMagasinDeRecette, type Recipe } from '../types'

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
      if (!estMagasinDeRecette(x.magasin)) {
        erreurs.push(`${oi} : « magasin » doit être l'un de : ${MAGASINS_DE_RECETTE.join(', ')}.`)
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
      ingredients: r.ingredients as Recipe['ingredients'],
      etapes: r.etapes as string[],
      ...(typeof r.image === 'string' && r.image ? { image: r.image } : {}),
      ...(typeof r.description === 'string' && r.description ? { description: r.description } : {}),
      ...(Array.isArray(r.astuces) ? { astuces: r.astuces as string[] } : {}),
    },
  }
}

import { RAYONS, UNITS, type RayonId, type Recipe } from '../types'
import { traduire } from './i18n'
import { rayonDe } from './rayons'

const RAYONS_VALIDES = Object.keys(RAYONS) as RayonId[]

/**
 * Valide le JSON collé par l'utilisateur (généré par une IA à partir
 * du prompt-template). Mêmes règles que scripts/lint-recipes.mjs,
 * réduites à ce qui bloque vraiment l'usage — pas la détection de
 * vocabulaire similaire, inutile sur une recette isolée.
 *
 * Les messages sortent du dictionnaire : ils s'affichent tels quels
 * dans l'écran « Ajouter une recette », et l'app entière était
 * traduite sauf eux — coller un JSON bancal en anglais répondait en
 * français. `traduire` lit la langue courante hors de React (voir
 * lib/i18n.tsx), cette fonction n'étant pas un composant.
 */
/**
 * Une photo doit être un fichier livré avec le build. Le champ acceptait
 * n'importe quelle URL, ce qui démentait les deux promesses du README :
 * les photos tiennent hors ligne, et aucun lien extérieur ne peut mourir
 * en laissant un cadre vide. Une recette sans photo reste valide — la
 * vignette teintée prend le relais.
 */
function estPhotoLivree(image: unknown): image is string {
  return typeof image === 'string' && /^\/plats\/[a-z0-9-]+\.webp$/.test(image)
}

export function validerRecette(json: unknown): { recette: Recipe } | { erreurs: string[] } {
  const erreurs: string[] = []

  if (typeof json !== 'object' || json === null) {
    return { erreurs: [traduire('validation.pasUnObjet')] }
  }
  const r = json as Record<string, unknown>

  if (typeof r.titre !== 'string' || !r.titre.trim()) erreurs.push(traduire('validation.titreManquant'))
  if (!Number.isFinite(r.temps) || (r.temps as number) <= 0) erreurs.push(traduire('validation.tempsInvalide'))
  if (!Number.isFinite(r.portions) || (r.portions as number) < 1) erreurs.push(traduire('validation.portionsInvalide'))
  if (!Array.isArray(r.tags)) erreurs.push(traduire('validation.tagsInvalide'))
  if (!Array.isArray(r.etapes) || r.etapes.length === 0) erreurs.push(traduire('validation.etapesInvalide'))

  if (!Array.isArray(r.ingredients) || r.ingredients.length === 0) {
    erreurs.push(traduire('validation.ingredientsInvalide'))
  } else {
    r.ingredients.forEach((ing, i) => {
      const oi = traduire('validation.ingredientN', { n: i + 1 })
      if (typeof ing !== 'object' || ing === null) {
        erreurs.push(traduire('validation.ingredientPasObjet', { oi }))
        return
      }
      const x = ing as Record<string, unknown>
      if (typeof x.nom !== 'string' || !x.nom.trim()) {
        erreurs.push(traduire('validation.ingredientNomManquant', { oi }))
      }
      if (!Number.isFinite(x.quantite) || (x.quantite as number) <= 0) {
        erreurs.push(traduire('validation.ingredientQuantiteInvalide', { oi }))
      }
      if (typeof x.unite !== 'string' || !UNITS.includes(x.unite as (typeof UNITS)[number])) {
        erreurs.push(traduire('validation.ingredientUniteInvalide', { oi, liste: UNITS.join(', ') }))
      }
      // Un ingrédient d'une recette écrite avant les rayons nomme un
      // magasin ; on le traduit plutôt que de refuser le collage.
      if (!RAYONS_VALIDES.includes(x.rayon as RayonId) && typeof x.magasin !== 'string') {
        erreurs.push(
          traduire('validation.ingredientRayonInvalide', { oi, liste: RAYONS_VALIDES.join(', ') }),
        )
      }
    })
  }

  // Une image écartée sans un mot laisserait croire à un bug d'affichage.
  if (r.image !== undefined && !estPhotoLivree(r.image)) {
    erreurs.push(
      '« image » doit désigner une photo livrée avec l\'app (/plats/<nom>.webp). Omettez le champ pour utiliser la vignette.',
    )
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
      ...(estPhotoLivree(r.image) ? { image: r.image } : {}),
      ...(typeof r.description === 'string' && r.description ? { description: r.description } : {}),
      ...(Array.isArray(r.astuces) ? { astuces: r.astuces as string[] } : {}),
    },
  }
}

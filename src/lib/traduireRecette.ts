import type { Recipe, RecipeIngredient } from '../types'
import glossaire from '../data/glossaire.en.json'
import traductions from '../data/recipes.en.json'
import type { Langue } from './i18n'

/**
 * Le corpus est écrit en français : c'est lui qui fait foi, et lui seul
 * qui voyage entre les téléphones. L'anglais vit à côté, dans deux
 * fichiers de données indexés par la version française.
 *
 * Ce choix a une conséquence qui n'est pas un détail : le nom d'un
 * ingrédient est la clé d'agrégation de la liste de courses
 * (`${nom}|${unite}`, voir lib/aggregate.ts) et de la synchro. Traduire
 * un nom couperait une ligne de liste en deux dès qu'un téléphone est
 * en anglais et l'autre en français. La traduction reste donc un
 * habillage d'affichage — on ne remplace jamais la clé.
 */
type Traduction = {
  titre?: string
  description?: string
  etapes?: string[]
  astuces?: string[]
}

const parId = traductions as Record<string, Traduction | undefined>
const noms = glossaire.ingredients as Record<string, string | undefined>
const tags = glossaire.tags as Record<string, string | undefined>

/**
 * Le nom d'un ingrédient tel qu'on l'affiche. Une recette ajoutée à la
 * main par l'utilisateur n'est dans aucun glossaire : son nom s'affiche
 * tel qu'il l'a écrit, ce qui vaut mieux qu'un blanc.
 */
export const nomIngredient = (nom: string, langue: Langue): string =>
  (langue === 'en' ? noms[nom] : undefined) ?? nom

/** Idem pour un tag du catalogue (« végé », « mijoté »). */
export const nomTag = (tag: string, langue: Langue): string =>
  (langue === 'en' ? tags[tag] : undefined) ?? tag

/**
 * Le titre affiché seul, pour les écrans qui listent des recettes sans
 * avoir besoin du reste. La teinte et l'identité d'une carte, elles,
 * restent calculées sur le titre français : une recette ne doit pas
 * changer de couleur en changeant de langue.
 */
export const titreRecette = (recette: Recipe, langue: Langue): string =>
  (langue === 'en' ? parId[recette.id]?.titre : undefined) ?? recette.titre

/**
 * La recette telle qu'on la montre à l'écran. Champ par champ : une
 * recette collée par l'utilisateur, ou une recette du corpus dont la
 * traduction serait incomplète, garde son texte français plutôt que de
 * perdre une étape en route.
 *
 * `ingredients` conserve `nom` — la clé — et gagne `affichage`, qui est
 * ce qu'on écrit. Le reste de l'app continue de lire `nom` sans savoir
 * qu'il existe une seconde langue.
 */
export type IngredientAffiche = RecipeIngredient & { affichage: string }

export interface RecetteAffichee extends Omit<Recipe, 'ingredients'> {
  ingredients: IngredientAffiche[]
}

export function recetteAffichee(recette: Recipe, langue: Langue): RecetteAffichee {
  const tr = langue === 'en' ? parId[recette.id] : undefined
  const etapes =
    tr?.etapes?.length === recette.etapes.length ? tr.etapes : recette.etapes
  const astuces =
    recette.astuces && tr?.astuces?.length === recette.astuces.length
      ? tr.astuces
      : recette.astuces

  return {
    ...recette,
    titre: tr?.titre ?? recette.titre,
    description: tr?.description ?? recette.description,
    etapes,
    astuces,
    tags: recette.tags.map((tag) => nomTag(tag, langue)),
    ingredients: recette.ingredients.map((ing) => ({
      ...ing,
      affichage: nomIngredient(ing.nom, langue),
    })),
  }
}

import { RAYONS, UNITS, type RayonId } from '../types'
import { traduire } from './i18n'

/** « fruits-legumes (Fruits & légumes), … » — de quoi choisir sans deviner, dans la langue active. */
function rayonsDecrits(): string {
  return (Object.keys(RAYONS) as RayonId[])
    .filter((r) => r !== 'autre')
    .map((r) => `${r} (${traduire(`rayons.${r}`)})`)
    .join(', ')
}

/**
 * Prompt à copier-coller dans une IA (Claude, ChatGPT…) pour obtenir
 * une recette directement au format attendu par l'app — la réponse se
 * recolle dans la section « Ajouter une recette » de l'écran
 * « Proposer », rien à retaper à la main. Généré dans la langue active :
 * coller la réponse d'une IA qui a répondu dans l'autre langue que
 * l'app afficherait des rayons traduits pour des noms restés étrangers.
 */
export function genererPrompt(demande: string): string {
  return traduire('promptRecette.corps', {
    demande: demande || traduire('promptRecette.demandeParDefaut'),
    unites: UNITS.join(', '),
    rayons: rayonsDecrits(),
  })
}

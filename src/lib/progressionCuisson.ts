/**
 * Où on en était dans une recette. Quitter le mode cuisson — bouton
 * retour, appel qui arrive, PWA balayée par le système — repartait de
 * l'étape 1 : le seul état de la session était en mémoire React.
 *
 * `localStorage` plutôt qu'IndexedDB : c'est synchrone, donc l'écran
 * sait dès son premier rendu s'il y a quelque chose à reprendre, sans
 * afficher « Commencer » puis se corriger. Et par appareil, pas par
 * foyer : c'est le téléphone posé sur le plan de travail qui suit la
 * recette, pas la maison.
 */

const PREFIXE = 'fffood:cuisson:'

/**
 * Au-delà, ce n'est plus la même séance de cuisine : proposer de
 * reprendre l'étape 4 d'un plat cuisiné avant-hier n'a pas de sens, et
 * la reprise deviendrait un piège plutôt qu'un filet.
 */
const PEREMPTION = 6 * 3_600_000

export function lireProgression(recipeId: string): number | null {
  try {
    const brut = localStorage.getItem(PREFIXE + recipeId)
    if (!brut) return null
    const { etape, date } = JSON.parse(brut) as { etape: number; date: number }
    if (!Number.isInteger(etape) || etape < 1) return null
    if (Date.now() - date > PEREMPTION) {
      oublierProgression(recipeId)
      return null
    }
    return etape
  } catch {
    return null
  }
}

export function ecrireProgression(recipeId: string, etape: number): void {
  try {
    localStorage.setItem(PREFIXE + recipeId, JSON.stringify({ etape, date: Date.now() }))
  } catch {
    /* stockage plein ou navigation privée stricte : tant pis, pas de reprise */
  }
}

export function oublierProgression(recipeId: string): void {
  try {
    localStorage.removeItem(PREFIXE + recipeId)
  } catch {
    /* idem */
  }
}

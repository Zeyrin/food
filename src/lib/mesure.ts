/**
 * Mesure d'usage : quels gestes sont réellement faits dans l'app.
 *
 * Le compteur de pages ne dit rien ici : l'app est une SPA d'une seule
 * URL, et les 391 « pages vues » relevées sur 51 sessions étaient toutes
 * `/` — un changement d'écran passe par `history.pushState`, que le script
 * compte comme une page. On mesure donc des gestes, pas des pages.
 *
 * Trois règles tenues par ce module :
 *
 * 1. Aucun contenu d'utilisateur ne sort. Jamais un titre de recette, un
 *    nom d'ingrédient, un code de foyer ni un UUID — que des compteurs et
 *    des valeurs choisies dans une liste fermée. Ce qu'on veut savoir,
 *    c'est « la liste a été générée », pas « les Dupont mangent du tofu ».
 * 2. L'absence du script n'est pas une erreur. Hors ligne, bloqueur de
 *    pub, script pas encore chargé : la fonction ne fait rien et n'émet
 *    aucun bruit dans la console.
 * 3. Un échec de mesure n'interrompt jamais un geste. Le `try` est là pour
 *    ça : cocher un produit en rayon ne peut pas échouer à cause d'une
 *    statistique.
 */

type Valeur = string | number

interface Rybbit {
  event?: (nom: string, proprietes?: Record<string, Valeur>) => void
}

/** Les gestes qui valent d'être comptés, et eux seuls. */
export type Geste =
  | 'foyer_cree'
  | 'foyer_rejoint'
  | 'visite_terminee'
  | 'visite_passee'
  | 'plat_ajoute_au_panier'
  | 'plat_retire_du_panier'
  | 'liste_generee'
  | 'tri_termine'
  | 'liste_envoyee'
  | 'courses_terminees'
  | 'cuisson_commencee'
  | 'cuisson_reprise'
  | 'cuisson_terminee'
  | 'minuteur_lance'
  | 'recette_collee'
  | 'recette_modifiee'
  | 'recette_supprimee'
  | 'panier_vide'
  | 'langue_changee'

export function mesurer(geste: Geste, proprietes?: Record<string, Valeur>): void {
  try {
    const rybbit = (window as Window & { rybbit?: Rybbit }).rybbit
    rybbit?.event?.(geste, proprietes)
  } catch {
    /* une statistique ne fait pas échouer un geste */
  }
}

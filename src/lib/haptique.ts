/**
 * Un retour au doigt, discret, sur les gestes qui comptent : mettre un
 * plat au panier, cocher un produit, finir les courses. En magasin, le
 * téléphone est souvent tenu bas, l'écran à moitié vu : sentir la coche
 * dispense de vérifier qu'elle a pris.
 *
 * Trois motifs seulement, toujours les mêmes pour le même sens — un
 * retour haptique n'apprend rien s'il varie. Jamais seul : chaque geste
 * a déjà son retour visuel, la vibration ne fait que le doubler.
 *
 * `navigator.vibrate` n'existe ni sur Safari ni sur la plupart des
 * navigateurs de bureau : l'appel est alors simplement sans effet.
 */
const MOTIFS = {
  /** Un toucher qui change un état : coche, ajout. */
  leger: 8,
  /** Un retour en arrière : décocher, retirer. */
  retrait: 4,
  /** Une tâche terminée : la dernière case des courses. */
  succes: [12, 70, 18],
} as const

export function vibrer(motif: keyof typeof MOTIFS): void {
  try {
    navigator.vibrate?.(MOTIFS[motif] as number | number[])
  } catch {
    // Certaines WebViews lèvent au lieu d'ignorer : rien à rattraper.
  }
}

/**
 * Teinte stable dérivée du titre : chaque recette garde toujours
 * la même couleur d'un lancement à l'autre, sans dépendre de vraies
 * photos qu'on n'a pas.
 */
export function teinteRecette(titre: string): number {
  let h = 0
  for (let i = 0; i < titre.length; i++) h = (h * 31 + titre.charCodeAt(i)) % 360
  return h
}

/**
 * Ce que le téléphone envoie à FFFood depuis son menu « Partager ».
 *
 * Une recette se trouve ailleurs : un blog, un compte Instagram, un site
 * de cuisine. Jusqu'ici, l'importer voulait dire copier l'adresse, ouvrir
 * FFFood, trouver « Ajouter une recette », choisir « Depuis un lien » et
 * coller. FFFood se déclare maintenant comme cible de partage — dans le
 * manifeste de la PWA (`share_target`) et dans l'app Android (un intent
 * `SEND`, voir `MainActivity.java`) — et les deux arrivent au même
 * endroit : `/partage/?title=…&text=…&url=…`.
 *
 * Chaque app range l'adresse où elle veut : Chrome la met dans `url`,
 * Instagram et la plupart des apps Android la glissent dans `text` au
 * milieu d'une phrase. On cherche donc la première adresse dans les trois.
 *
 * Fonction pure, testée.
 */
import { extraireUrl } from './importerRecette'

const CHEMIN = /^\/partage\/?$/

/**
 * `null` : on n'arrive pas par un partage. `{ url: null }` : un partage
 * sans adresse dedans (du texte seul), qu'on ne sait pas importer.
 */
export function lirePartage(chemin: string, requete: string): { url: string | null } | null {
  if (!CHEMIN.test(chemin)) return null
  const p = new URLSearchParams(requete)
  for (const champ of ['url', 'text', 'title']) {
    const url = extraireUrl(p.get(champ) ?? '')
    if (url) return { url }
  }
  return { url: null }
}

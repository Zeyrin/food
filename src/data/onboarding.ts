import type { Onglet } from '../types'

/**
 * Contenu de la visite guidée (voir components/TourGuide.tsx). Chaque
 * étape désigne un élément réel de l'interface via son attribut
 * `data-tour`, et l'onglet qui doit être actif pour qu'il existe à
 * l'écran — la visite bascule l'app dessus toute seule. `cible: null`
 * affiche une carte centrée sans repérer d'élément (ouverture et
 * clôture de la visite). `onglet: null` garde l'onglet déjà actif.
 *
 * Ajouter, retirer, réordonner ou reformuler une étape ici suffit à
 * changer la visite — aucun autre fichier à toucher, tant que l'attribut
 * `data-tour` visé existe déjà quelque part dans l'interface.
 */
export interface EtapeVisite {
  cible: string | null
  onglet: Onglet | null
  titre: string
  texte: string
}

export const VISITE_GUIDEE: EtapeVisite[] = [
  {
    cible: null,
    onglet: 'propose',
    titre: 'Bienvenue sur FFFood',
    texte:
      "Un tour de deux minutes pour repérer les boutons utiles. Choisissez vos repas, générez la liste de courses, et cuisinez — sans compte, sans pub, même hors ligne en magasin.",
  },
  {
    cible: 'recherche-propose',
    onglet: 'propose',
    titre: 'Chercher une recette',
    texte:
      "Un titre de plat, mais aussi un ingrédient : tapez « aubergine » pour trouver quoi faire de celle qui traîne.",
  },
  {
    cible: 'filtres-propose',
    onglet: 'propose',
    titre: 'Filtrer le catalogue',
    texte: "Par temps de préparation, par tag, ou juste les plats « à refaire » que vous avez aimés.",
  },
  {
    cible: 'nav-panier',
    onglet: 'panier',
    titre: 'Le Panier',
    texte:
      "Les plats retenus pour la semaine atterrissent ici. Ajustez le nombre de parts, puis générez la liste quand vous êtes prêt·e.",
  },
  {
    cible: 'nav-ajouter',
    onglet: 'panier',
    titre: 'Ajouter une recette',
    texte:
      "Toujours accessible : ce bouton fait entrer une nouvelle recette dans votre catalogue, en quelques secondes avec l'aide d'une IA.",
  },
  {
    cible: 'nav-liste',
    onglet: 'liste',
    titre: 'La Liste',
    texte: "Générée automatiquement à partir du panier, triée par magasin. Cochez d'abord ce que vous avez déjà.",
  },
  {
    cible: 'nav-cuisson',
    onglet: 'cuisson',
    titre: 'Le mode Cuisson',
    texte: 'Les étapes défilent une à une, avec les quantités affichées directement dans le texte.',
  },
  {
    cible: 'reglages',
    onglet: null,
    titre: 'Réglages',
    texte: 'Le code de votre foyer à partager, et cette visite à tout moment, vous attendent ici.',
  },
  {
    cible: null,
    onglet: 'propose',
    titre: "C'est parti !",
    texte: "Vous savez l'essentiel. Le reste se découvre en cuisinant.",
  },
]

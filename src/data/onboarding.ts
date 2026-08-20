import type { Nom as IconeNom } from '../components/Icone'

/**
 * Contenu de l'écran de présentation (voir screens/Onboarding.tsx).
 * Une diapo = une fonctionnalité. Ajouter, retirer ou reformuler une
 * entrée ici suffit à changer la présentation — aucun autre fichier à
 * toucher.
 */
export interface DiapoOnboarding {
  icone: IconeNom
  titre: string
  texte: string
}

export const ONBOARDING_SLIDES: DiapoOnboarding[] = [
  {
    icone: 'etoile',
    titre: 'Bienvenue sur FFFood',
    texte:
      "Choisissez vos repas de la semaine, générez la liste de courses, et cuisinez. Sans compte, sans pub, et ça marche même hors ligne en magasin.",
  },
  {
    icone: 'etoile',
    titre: 'Proposer',
    texte:
      "Parcourez le catalogue de recettes, filtrez par temps ou par tag, et ajoutez celles qui vous tentent d'un tap sur le +.",
  },
  {
    icone: 'panier',
    titre: 'Panier',
    texte:
      "Ajustez le nombre de parts de chaque plat retenu, complétez votre semaine, puis générez la liste dès que vous êtes prêt.",
  },
  {
    icone: 'liste',
    titre: 'Liste',
    texte:
      "La liste de courses se construit toute seule, triée par magasin. Cochez d'abord ce que vous avez déjà avant d'y aller.",
  },
  {
    icone: 'grill',
    titre: 'Cuisson',
    texte:
      "Suivez les étapes une à une : les quantités s'affichent directement dans le texte, plus besoin de faire l'aller-retour avec la recette.",
  },
  {
    icone: 'plus-cercle',
    titre: 'Ajouter une recette',
    texte:
      "Depuis l'onglet « Ajouter », copiez le prompt fourni, demandez une recette à une IA, puis collez sa réponse : elle rejoint votre catalogue en quelques secondes.",
  },
  {
    icone: 'boite',
    titre: 'Un foyer partagé',
    texte:
      "Partagez le code de votre foyer : la liste et le panier se mettent à jour en temps réel pour tout le monde. Le code se retrouve dans Réglages à tout moment.",
  },
]

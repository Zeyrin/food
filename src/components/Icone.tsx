/**
 * Icônes SVG en dur, dans le style Material Symbols Outlined des
 * maquettes (traits 2px, coins arrondis) — sans dépendre d'une police
 * d'icônes chargée en ligne, l'app doit marcher hors connexion.
 */
export type Nom =
  | 'menu'
  | 'etoile'
  | 'coeur'
  | 'panier'
  | 'liste'
  | 'grill'
  | 'plus'
  | 'plus-cercle'
  | 'coche'
  | 'moins'
  | 'feuille'
  | 'boite'
  | 'alerte'
  | 'fermer'
  | 'minuteur'
  | 'precedent'
  | 'suivant'
  | 'recherche'
  | 'rafraichir'
  | 'poisson'
  | 'lait'
  | 'pain'
  | 'flocon'
  | 'bouteille'
  | 'magasin'
  | 'crayon'
  | 'etincelle'
  | 'copier'
  | 'bulle'

const TRACES: Record<Nom, string> = {
  menu: 'M4 6h16M4 12h16M4 18h16',
  etoile:
    'M12 3l2.4 5.5L20 9l-4.6 3.8L16.9 19 12 15.8 7.1 19l1.5-6.2L4 9l5.6-.5L12 3z',
  coeur:
    'M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 00-7.8 7.8l1.1 1.1L12 21.2l7.8-7.8 1.1-1.1a5.5 5.5 0 000-7.8z',
  panier: 'M6 6h15l-1.5 9h-12z M6 6l-1-3H2 M9 20a1 1 0 100-2 1 1 0 000 2z M18 20a1 1 0 100-2 1 1 0 000 2z',
  liste: 'M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01',
  grill: 'M5 8h14l-1.5 11h-11z M8 8V5a4 4 0 018 0v3',
  plus: 'M12 5v14M5 12h14',
  'plus-cercle': 'M12 8v8M8 12h8 M12 21a9 9 0 100-18 9 9 0 000 18z',
  coche: 'M5 13l4 4L19 7',
  moins: 'M5 12h14',
  feuille: 'M5 20C5 10 12 4 20 4c0 8-6 15-16 16z M5 20c2-4 6-8 11-10',
  boite: 'M4 8l8-4 8 4-8 4-8-4z M4 8v9l8 4 8-4V8 M12 12v9',
  alerte: 'M12 9v4 M12 17h.01 M4 20h16L12 4z',
  fermer: 'M6 6l12 12M18 6L6 18',
  minuteur: 'M12 3v3 M12 22a8 8 0 100-16 8 8 0 000 16z M12 9v5l3 2',
  precedent: 'M15 5l-7 7 7 7',
  suivant: 'M9 5l7 7-7 7',
  recherche: 'M11 4a7 7 0 100 14 7 7 0 000-14z M21 21l-4.3-4.3',
  rafraichir:
    'M20 12a8 8 0 11-2.3-5.7 M20 4v5h-5',
  poisson:
    'M22 12c-2.5 3.5-5.5 5.5-9 5.5S8.5 15.5 6.5 12c2-3.5 5-5.5 6.5-5.5s6.5 2 9 5.5z M6.5 12L2 8v8l4.5-4z M17 11h.01',
  lait: 'M8 9l4-5 4 5v10a1 1 0 01-1 1H9a1 1 0 01-1-1V9z M8 13h8',
  pain: 'M4 13c0-4.4 3.6-7 8-7s8 2.6 8 7v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4z M9.5 6.5L8.5 18 M15 6.5L14 18',
  flocon: 'M12 2v20 M3.6 7l16.8 10 M20.4 7L3.6 17',
  bouteille: 'M10 2h4 M10.5 2v4L9 9.5V20a1 1 0 001 1h4a1 1 0 001-1V9.5L13.5 6V2 M9 13h6',
  magasin: 'M4 10h16v9a1 1 0 01-1 1H5a1 1 0 01-1-1v-9z M3 10l1.5-5h15L21 10 M9.5 20v-6h5v6',
  crayon: 'M4 20h4L19.5 8.5a2.8 2.8 0 10-4-4L4 16v4z M14.5 5.5l4 4',
  etincelle:
    'M11 3l1.8 4.7L17.5 9.5 12.8 11.3 11 16l-1.8-4.7L4.5 9.5 9.2 7.7z M18 14l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z',
  // Deux feuilles décalées : la seconde est la copie de la première, et
  // c'est le décalage qui le dit — pas un presse-papiers, qui se confond
  // avec « liste » à 18 px.
  copier:
    'M9 9a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2h-8a2 2 0 01-2-2V9z M5 15H4a2 2 0 01-2-2V5a2 2 0 012-2h8a2 2 0 012 2v1',
  bulle:
    'M4 5a2 2 0 012-2h12a2 2 0 012 2v9a2 2 0 01-2 2H9l-4 4v-4a2 2 0 01-2-2V5z M8 9h8 M8 12.5h5',
}

export default function Icone({ nom, taille = 24 }: { nom: Nom; taille?: number }) {
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={TRACES[nom]} />
    </svg>
  )
}

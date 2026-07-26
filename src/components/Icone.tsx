/**
 * Icônes SVG en dur, dans le style Material Symbols Outlined des
 * maquettes (traits 2px, coins arrondis) — sans dépendre d'une police
 * d'icônes chargée en ligne, l'app doit marcher hors connexion.
 */
export type Nom =
  | 'menu'
  | 'etoile'
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

const TRACES: Record<Nom, string> = {
  menu: 'M4 6h16M4 12h16M4 18h16',
  etoile:
    'M12 3l2.4 5.5L20 9l-4.6 3.8L16.9 19 12 15.8 7.1 19l1.5-6.2L4 9l5.6-.5L12 3z',
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

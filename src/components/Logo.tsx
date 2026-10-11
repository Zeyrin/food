/**
 * La marque : trois F en écho, le bégaiement du nom. Même dessin que
 * l'icône d'app (`assets/logo.svg`), pour que l'écran d'attente et
 * l'accueil montrent exactement ce qu'on a touché sur l'écran d'accueil.
 * Les couleurs sont fixes : c'est un logo, il ne suit pas le thème.
 */
const FOND = '#385e16'
const TRAITS: [string, string][] = [
  ['M133 356V116H283', '#a53c3e'],
  ['M181 378V138H331', '#cefda3'],
  ['M229 400V160H379M229 272H335', '#fff8ef'],
]

export default function Logo({ taille, className }: { taille: number; className?: string }) {
  return (
    <svg
      className={className}
      width={taille}
      height={taille}
      viewBox="0 0 512 512"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="512" height="512" rx="115" fill={FOND} />
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {TRAITS.map(([d, couleur]) => [
          // Le contour couleur fond détache chaque F de celui de derrière.
          <path key={d + 'c'} d={d} stroke={FOND} strokeWidth={88} />,
          <path key={d} d={d} stroke={couleur} strokeWidth={60} />,
        ])}
      </g>
    </svg>
  )
}

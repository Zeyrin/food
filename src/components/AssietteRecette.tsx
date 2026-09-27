import { memo } from 'react'
import type { RecipeIngredient } from '../types'
import { composerAssiette, type Element } from '../lib/assiette'

/**
 * L'assiette dessinée qui tient lieu de photo (voir `lib/assiette.ts`).
 *
 * Aucun dégradé ni filtre SVG : un `url(#id)` se résout sur le premier
 * élément du document qui porte cet id, et la grille rend une centaine
 * d'assiettes dont la plupart sont hors champ (`content-visibility`) —
 * le dégradé d'une carte non rendue disparaissait de toutes les autres.
 * Des aplats superposés à faible opacité donnent le même modelé.
 *
 * Mémoïsé : la grille re-rend à chaque ajout au panier, et recalculer
 * cent assiettes pour une coche ne sert à rien.
 */
function AssietteRecette({ titre, ingredients }: { titre: string; ingredients: readonly RecipeIngredient[] }) {
  const elements = composerAssiette(titre, ingredients)
  return (
    <svg className="assiette" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      {/* Ombre portée, décalée vers le bas : la lumière vient d'en haut. */}
      <ellipse cx="51" cy="54" rx="44" ry="43" className="assiette-ombre" />
      <circle cx="50" cy="50" r="43" className="assiette-marli" />
      <circle cx="50" cy="50" r="31.5" className="assiette-creux" />
      <circle cx="50" cy="50" r="31.5" className="assiette-filet" />
      {/* Servi un peu plus grand que le repère : la nourriture doit
          remplir le creux, pas flotter au milieu de la faïence. */}
      <g transform="translate(50 50) scale(1.14) translate(-50 -50)">{elements.map((e, i) => dessiner(e, i))}</g>
      {/* Reflet sur le marli, en haut à gauche. */}
      <path d="M17 40 A34 34 0 0 1 40 17" className="assiette-reflet" />
    </svg>
  )
}

function dessiner(e: Element, i: number) {
  switch (e.type) {
    case 'chemin':
      return <path key={i} d={e.d} fill={e.couleur} fillOpacity={e.opacite} />
    case 'rond':
      return <circle key={i} cx={e.cx} cy={e.cy} r={e.r} fill={e.couleur} fillOpacity={e.opacite} />
    case 'trait':
      return (
        <path
          key={i}
          d={e.d}
          fill="none"
          stroke={e.couleur}
          strokeWidth={e.epaisseur}
          strokeLinecap="round"
          strokeOpacity={e.opacite}
        />
      )
    case 'tranche':
      return (
        <g key={i}>
          <circle cx={e.cx} cy={e.cy} r={e.r} fill={e.couleur} />
          <circle cx={e.cx} cy={e.cy} r={e.r * 0.64} fill="#ffffff" fillOpacity={0.28} />
          <circle cx={e.cx} cy={e.cy} r={e.r * 0.18} fill={e.couleur} />
        </g>
      )
    case 'feuille': {
      const l = e.l
      return (
        <g key={i} transform={`translate(${e.cx.toFixed(1)} ${e.cy.toFixed(1)}) rotate(${e.angle})`}>
          <path d={`M${-l} 0Q0 ${-l * 0.62} ${l} 0Q0 ${l * 0.62} ${-l} 0Z`} fill={e.couleur} />
          <path d={`M${-l * 0.8} 0H${l * 0.8}`} className="assiette-nervure" />
        </g>
      )
    }
  }
}

export default memo(AssietteRecette)

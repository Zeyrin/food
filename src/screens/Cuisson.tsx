import { useState } from 'react'
import type { Recipe, Verdict } from '../types'
import { annoterEtape, formatQuantite } from '../lib/aggregate'
import { useWakeLock } from '../hooks/useWakeLock'

interface Props {
  recette: Recipe
  onVerdict: (v: Verdict) => void
  onQuitter: () => void
}

export default function Cuisson({ recette, onVerdict, onQuitter }: Props) {
  const [index, setIndex] = useState(-1)
  useWakeLock(true)

  const fini = index >= recette.etapes.length

  return (
    <>
      <button className="discret" onClick={onQuitter} style={{ marginTop: 20 }}>
        ← Quitter
      </button>

      <h1>{recette.titre}</h1>

      <div className="progression" aria-hidden="true">
        {recette.etapes.map((_, i) => (
          <i key={i} data-fait={i <= index} />
        ))}
      </div>

      {index < 0 && (
        <>
          <h2>Ce qu'il faut</h2>
          {recette.ingredients.map((ing) => (
            <div className="rangee" key={ing.nom} style={{ cursor: 'default' }}>
              <span className="nom">{ing.nom}</span>
              <span className="qte">{formatQuantite(ing)}</span>
            </div>
          ))}
          <h2>Les étapes</h2>
          <ol className="apercu-etapes">
            {recette.etapes.map((etape, i) => (
              <li key={i}>{etape}</li>
            ))}
          </ol>
          <button className="principal" onClick={() => setIndex(0)}>
            Commencer
          </button>
        </>
      )}

      {index >= 0 && !fini && (
        <>
          <div className="meta">
            Étape {index + 1} sur {recette.etapes.length}
          </div>
          <p className="etape">
            {annoterEtape(recette.etapes[index] ?? '', recette.ingredients).map((seg, i) => (
              <span key={i}>
                {seg.texte}
                {seg.quantite && <b className="dose"> {seg.quantite}</b>}
              </span>
            ))}
          </p>
          <details className="ingredients-rappel">
            <summary>Ingrédients</summary>
            {recette.ingredients.map((ing) => (
              <div className="rangee" key={ing.nom} style={{ cursor: 'default' }}>
                <span className="nom">{ing.nom}</span>
                <span className="qte">{formatQuantite(ing)}</span>
              </div>
            ))}
          </details>
          <button className="principal" onClick={() => setIndex(index + 1)}>
            {index + 1 === recette.etapes.length ? 'Terminé' : 'Suivant'}
          </button>
          {index > 0 && (
            <button className="discret" onClick={() => setIndex(index - 1)} style={{ marginTop: 10 }}>
              Étape précédente
            </button>
          )}
        </>
      )}

      {fini && (
        <>
          <p className="etape">C'était comment ?</p>
          <button className="principal" onClick={() => onVerdict('refaire')}>
            À refaire
          </button>
          <button
            className="discret"
            onClick={() => onVerdict('jamais')}
            style={{ marginTop: 10, width: '100%' }}
          >
            Ne plus me la proposer
          </button>
        </>
      )}
    </>
  )
}

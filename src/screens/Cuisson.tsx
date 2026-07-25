import { useState } from 'react'
import type { Recipe, Verdict } from '../types'
import { annoterEtape, formatQuantite } from '../lib/aggregate'
import { useWakeLock } from '../hooks/useWakeLock'
import Icone from '../components/Icone'

interface Props {
  recette: Recipe
  onVerdict: (v: Verdict) => void
  onQuitter: () => void
}

export default function Cuisson({ recette, onVerdict, onQuitter }: Props) {
  const [index, setIndex] = useState(-1)
  useWakeLock(true)

  const fini = index >= recette.etapes.length

  if (index < 0) {
    return (
      <div className="cuisson">
        <button className="discret" onClick={onQuitter}>
          <Icone nom="precedent" taille={18} /> Quitter
        </button>

        <h1>{recette.titre}</h1>

        <h2>Ce qu'il faut</h2>
        {recette.ingredients.map((ing) => (
          <div className="rangee rangee-lecture" key={ing.nom}>
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
      </div>
    )
  }

  if (fini) {
    return (
      <div className="cuisson-focus">
        <div className="ecran-fin">
          <div className="ecran-fin-coche" aria-hidden="true">
            <Icone nom="coche" taille={40} />
          </div>
          <h1>C'était comment ?</h1>
          <p>Bon appétit ! Cuisinez-la à nouveau, ou écartez-la des prochaines idées.</p>
          <div className="ecran-fin-choix">
            <button className="choix-verdict" onClick={() => onVerdict('refaire')}>
              <Icone nom="etoile" taille={26} />
              À refaire
            </button>
            <button className="choix-verdict" onClick={() => onVerdict('jamais')}>
              <Icone nom="fermer" taille={26} />
              Jamais
            </button>
          </div>
          <button className="discret suite" onClick={onQuitter}>
            Retour au menu
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="cuisson-focus">
      <header className="cuisson-entete">
        <button className="cuisson-rond" onClick={onQuitter} aria-label="Quitter le mode cuisson">
          <Icone nom="fermer" taille={20} />
        </button>
        <div className="cuisson-progression">
          <span>
            Étape {index + 1} sur {recette.etapes.length}
          </span>
          <div className="progression" aria-hidden="true">
            {recette.etapes.map((_, i) => (
              <i key={i} data-fait={i <= index} />
            ))}
          </div>
        </div>
        <div className="cuisson-rond" aria-hidden="true" />
      </header>

      <div className="puces-ingredients">
        {recette.ingredients.map((ing) => (
          <span className="puce-ingredient" key={ing.nom}>
            {formatQuantite(ing)} {ing.nom}
          </span>
        ))}
      </div>

      <p className="etape-titre">
        {annoterEtape(recette.etapes[index] ?? '', recette.ingredients).map((seg, i) => (
          <span key={i}>
            {seg.texte}
            {seg.quantite && <b className="dose"> {seg.quantite}</b>}
          </span>
        ))}
      </p>

      <div className="cuisson-actions">
        {index > 0 && (
          <button className="bouton-cuisson bouton-cuisson-secondaire" onClick={() => setIndex(index - 1)}>
            <Icone nom="precedent" taille={20} /> Précédent
          </button>
        )}
        <button className="bouton-cuisson bouton-cuisson-principal" onClick={() => setIndex(index + 1)}>
          {index + 1 === recette.etapes.length ? 'Terminé' : (
            <>
              Suivant <Icone nom="suivant" taille={20} />
            </>
          )}
        </button>
      </div>
    </div>
  )
}

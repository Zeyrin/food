import { useEffect, useMemo, useState } from 'react'
import type { Recipe, Verdict } from '../types'
import { annoterEtape, formatQuantite } from '../lib/aggregate'
import { formatDuree, minuteursDeLEtape } from '../lib/duree'
import { useWakeLock } from '../hooks/useWakeLock'
import type { Minuteurs } from '../hooks/useMinuteurs'
import { ecrireProgression, lireProgression, oublierProgression } from '../lib/progressionCuisson'
import BandeauMinuteur from '../components/BandeauMinuteur'
import Icone from '../components/Icone'

interface Props {
  recette: Recipe
  /** Partagés avec toute l'app : ils survivent à la sortie de cet écran. */
  minuteurs: Minuteurs
  onOuvrirMinuteurs: () => void
  onVerdict: (v: Verdict) => void
  onQuitter: () => void
}

export default function Cuisson({ recette, minuteurs, onOuvrirMinuteurs, onVerdict, onQuitter }: Props) {
  const [index, setIndex] = useState(-1)
  // Lu une seule fois au montage : la valeur ne doit pas disparaître de
  // l'écran de préparation au moment où on écrit la progression suivante.
  const [reprise] = useState(() => lireProgression(recette.id))
  useWakeLock(true)

  const etape = recette.etapes[index] ?? ''
  const proposes = useMemo(() => minuteursDeLEtape(etape), [etape])

  const fini = index >= recette.etapes.length

  // On note l'étape en cours à chaque pas, et on oublie tout une fois
  // le plat terminé : reprendre une recette finie n'aurait aucun sens.
  useEffect(() => {
    if (index >= 1 && !fini) ecrireProgression(recette.id, index)
    if (fini) oublierProgression(recette.id)
  }, [recette.id, index, fini])

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

        {/* Toujours sous les yeux, quel que soit le défilement : on vient
            là pour commencer à cuisiner, pas pour lire jusqu'au bout. */}
        <div className="barre-actions">
          {reprise !== null && reprise < recette.etapes.length ? (
            <>
              {/* Une séance interrompue (le téléphone qui sonne, l'appli
                  balayée) reprend où elle en était — mais c'est un choix
                  explicite : rien de pire que de croire repartir du début
                  et sauter la moitié des étapes sans le voir. */}
              <button className="principal" onClick={() => setIndex(reprise)}>
                <Icone nom="grill" taille={20} /> Reprendre à l'étape {reprise + 1}
              </button>
              <button className="discret pleine-largeur" onClick={() => setIndex(0)}>
                Repartir du début
              </button>
            </>
          ) : (
            <button className="principal" onClick={() => setIndex(0)}>
              <Icone nom="grill" taille={20} /> Commencer
            </button>
          )}
        </div>
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
          {/* Les traits n'étaient qu'un décor : relire l'étape 2 depuis la
              7 demandait cinq appuis sur « Précédent ». Ce sont des
              boutons, avec une zone de touche débordant largement les
              6 px visibles. */}
          <div className="progression">
            {recette.etapes.map((_, i) => (
              <button
                key={i}
                data-fait={i <= index}
                aria-current={i === index ? 'step' : undefined}
                aria-label={`Aller à l'étape ${i + 1}`}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
        </div>
        {/* Repère à droite pour équilibrer le bouton fermer à gauche —
            le minuteur, lui, vit désormais dans le bandeau ci-dessous,
            trop important pour tenir dans un petit rond. */}
        <span className="cuisson-rond cuisson-rond-vide" aria-hidden="true" />
      </header>

      <BandeauMinuteur
        liste={minuteurs.liste}
        maintenant={minuteurs.maintenant}
        sonne={minuteurs.sonnent.length > 0}
        onOuvrir={onOuvrirMinuteurs}
      />

      {/* `details` natif : replié il ne coûte qu'une ligne, déplié il
          montre tout d'un coup. Aucun état à gérer, et il s'ouvre même
          si le rendu React est occupé ailleurs. */}
      <details className="tiroir-ingredients">
        <summary>
          <span>Ingrédients</span>
          <em>{recette.ingredients.length}</em>
          <Icone nom="suivant" taille={18} />
        </summary>
        <ul className="liste-ingredients">
          {recette.ingredients.map((ing) => (
            <li key={ing.nom}>
              <span>{ing.nom}</span>
              <b>{formatQuantite(ing)}</b>
            </li>
          ))}
        </ul>
      </details>

      {/* Seule zone qui défile : une étape longue ne pousse plus les
          boutons hors de l'écran. */}
      <div className="cuisson-corps" key={index}>
        <p className="etape-titre">
          {annoterEtape(etape, recette.ingredients).map((seg, i) => (
            <span key={i}>
              {seg.texte}
              {seg.quantite && <b className="dose"> {seg.quantite}</b>}
            </span>
          ))}
        </p>

        {/* Un bouton par durée citée dans l'étape : la durée est déjà
            sous les yeux, il ne reste qu'à la lancer. */}
        {proposes.length > 0 && (
          <div className="minuteurs-etape">
            {proposes.map((m) => (
              <button
                key={m.secondes}
                className="bouton-minuteur"
                onClick={() => minuteurs.lancer(m.secondes, m.nom, recette.id, recette.titre)}
              >
                <Icone nom="minuteur" taille={16} /> Lancer {formatDuree(m.secondes)}
              </button>
            ))}
          </div>
        )}

        {recette.astuces?.[index] && (
          <div className="bloc-astuce">
            <Icone nom="etoile" taille={20} />
            <p>{recette.astuces[index]}</p>
          </div>
        )}
      </div>

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

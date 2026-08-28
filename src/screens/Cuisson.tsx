import { useEffect, useMemo, useState } from 'react'
import type { Recipe, Verdict } from '../types'
import { dosesDeLEtape, etapeEnTexte, formatQuantite } from '../lib/aggregate'
import { formatDuree, minuteursDeLEtape } from '../lib/duree'
import { useWakeLock } from '../hooks/useWakeLock'
import type { Minuteurs } from '../hooks/useMinuteurs'
import { ecrireProgression, lireProgression, oublierProgression } from '../lib/progressionCuisson'
import { useLangue } from '../lib/i18n'
import { recetteAffichee } from '../lib/traduireRecette'
import BandeauMinuteur from '../components/BandeauMinuteur'
import { mesurer } from '../lib/mesure'
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
  const { t, langue } = useLangue()
  const [index, setIndex] = useState(-1)
  // Lu une seule fois au montage : la valeur ne doit pas disparaître de
  // l'écran de préparation au moment où on écrit la progression suivante.
  const [reprise] = useState(() => lireProgression(recette.id))
  useWakeLock(true)

  // Ce qui s'affiche : titre, étapes et noms d'ingrédients dans la
  // langue de l'app. `recette` reste la version française du corpus —
  // c'est elle qui porte les clés d'agrégation et la morphologie que
  // sait lire `dosesDeLEtape`.
  const affichee = useMemo(() => recetteAffichee(recette, langue), [recette, langue])

  const etape = affichee.etapes[index] ?? ''
  const proposes = useMemo(() => minuteursDeLEtape(etape), [etape])

  /**
   * Les doses de l'étape, sorties de la phrase. Elles sont repérées sur
   * le texte français, puis réétiquetées avec le nom affiché : « ail »
   * devient « garlic » sans que la reconnaissance ait à savoir lire
   * l'anglais.
   */
  const doses = useMemo(() => {
    const source = recette.etapes[index]
    if (source === undefined) return []
    const parNom = new Map(affichee.ingredients.map((ing) => [ing.nom, ing.affichage]))
    return dosesDeLEtape(source, recette.ingredients).map((ing) => ({
      cle: ing.nom,
      nom: parNom.get(ing.nom) ?? ing.nom,
      quantite: formatQuantite(ing),
    }))
  }, [recette, affichee, index])

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
        {/* Une flèche « précédent » sur un bouton « Quitter » disait deux
            choses à la fois : ici on n'a encore rien commencé, on revient
            juste en arrière. */}
        <button className="discret" onClick={onQuitter}>
          <Icone nom="precedent" taille={18} /> {t('cuisson.retour')}
        </button>

        <h1>{affichee.titre}</h1>

        <h2>{t('cuisson.titreIngredients', { n: affichee.ingredients.length })}</h2>
        {affichee.ingredients.map((ing) => (
          <div className="rangee rangee-lecture" key={ing.nom}>
            <span className="nom">{ing.affichage}</span>
            <span className="qte">{formatQuantite(ing)}</span>
          </div>
        ))}
        <h2>{t('cuisson.titreEtapes', { n: affichee.etapes.length })}</h2>
        <ol className="apercu-etapes">
          {affichee.etapes.map((etape, i) => (
            <li key={i}>{etapeEnTexte(etape)}</li>
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
              <button
                className="principal"
                onClick={() => {
                  mesurer('cuisson_reprise', { etape: reprise + 1, etapes: recette.etapes.length })
                  setIndex(reprise)
                }}
              >
                <Icone nom="grill" taille={20} />{' '}
                {t('cuisson.reprendre', { n: reprise + 1, total: recette.etapes.length })}
              </button>
              <button
                className="discret pleine-largeur"
                onClick={() => {
                  mesurer('cuisson_commencee', { etapes: recette.etapes.length, reprise: 0 })
                  setIndex(0)
                }}
              >
                {t('cuisson.repartirDuDebut')}
              </button>
            </>
          ) : (
            <button
              className="principal"
              onClick={() => {
                mesurer('cuisson_commencee', {
                  etapes: recette.etapes.length,
                  minutes: recette.temps,
                })
                setIndex(0)
              }}
            >
              <Icone nom="grill" taille={20} />{' '}
              {t('cuisson.commencer', {
                total: recette.etapes.length,
                s: recette.etapes.length > 1 ? 's' : '',
              })}
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
          <h1>{t('cuisson.cetaitComment')}</h1>
          <p>{t('cuisson.finTexte')}</p>
          {/* Les deux verdicts n'engagent pas la même chose : « à refaire »
              remonte le plat dans les propositions, « jamais » l'en écarte
              pour de bon. Ils avaient exactement la même apparence, à un
              pouce l'un de l'autre, au moment où on repose une poêle.
              L'un porte donc l'accent, l'autre reste en retrait. */}
          <div className="ecran-fin-choix">
            <button
              className="choix-verdict choix-verdict-oui"
              onClick={() => onVerdict('refaire')}
            >
              <Icone nom="etoile" taille={26} />
              {t('cuisson.aRefaire')}
            </button>
            <button className="choix-verdict" onClick={() => onVerdict('jamais')}>
              <Icone nom="fermer" taille={26} />
              {t('cuisson.jamais')}
            </button>
          </div>
          <button className="discret suite" onClick={onQuitter}>
            {t('cuisson.retourAuMenu')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="cuisson-focus">
      <header className="cuisson-entete">
        <button className="cuisson-rond" onClick={onQuitter} aria-label={t('cuisson.quitterModeCuisson')}>
          <Icone nom="fermer" taille={20} />
        </button>
        <div className="cuisson-progression">
          <span>{t('cuisson.etapeSur', { n: index + 1, total: recette.etapes.length })}</span>
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
                aria-label={t('cuisson.allerAEtape', { n: i + 1 })}
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
          <span>{t('cuisson.titreIngredients', { n: affichee.ingredients.length })}</span>
          <Icone nom="suivant" taille={18} />
        </summary>
        <ul className="liste-ingredients">
          {affichee.ingredients.map((ing) => (
            <li key={ing.nom}>
              <span>{ing.affichage}</span>
              <b>{formatQuantite(ing)}</b>
            </li>
          ))}
        </ul>
      </details>

      {/* Seule zone qui défile : une étape longue ne pousse plus les
          boutons hors de l'écran. */}
      <div className="cuisson-corps" key={index}>
        {/* La dose n'est plus dans la phrase. « Faire revenir l'ail
            60 g dans la poêle » se lit deux fois : une pour la
            consigne, une pour le nombre. Les quantités montent donc
            au-dessus, en ligne, et l'étape redevient une phrase qu'on
            lit d'un trait à un mètre du plan de travail. */}
        {doses.length > 0 && (
          <ul className="doses-etape" aria-label={t('cuisson.dosesDeLEtape')}>
            {doses.map((d) => (
              <li key={d.cle}>
                <b>{d.quantite}</b> {d.nom}
              </li>
            ))}
          </ul>
        )}

        <p className="etape-titre">{etapeEnTexte(etape)}</p>

        {/* Un bouton par durée citée dans l'étape : la durée est déjà
            sous les yeux, il ne reste qu'à la lancer. */}
        {proposes.length > 0 && (
          <div className="minuteurs-etape">
            {proposes.map((m) => (
              <button
                key={m.secondes}
                className="bouton-minuteur"
                onClick={() => {
                  mesurer('minuteur_lance', { secondes: m.secondes })
                  minuteurs.lancer(m.secondes, m.nom, recette.id, affichee.titre)
                }}
              >
                <Icone nom="minuteur" taille={16} /> {t('cuisson.lancer', { duree: formatDuree(m.secondes) })}
              </button>
            ))}
          </div>
        )}

        {affichee.astuces?.[index] && (
          <div className="bloc-astuce">
            <Icone nom="etoile" taille={20} />
            <p>{affichee.astuces[index]}</p>
          </div>
        )}
      </div>

      <div className="cuisson-actions">
        {index > 0 && (
          <button className="bouton-cuisson bouton-cuisson-secondaire" onClick={() => setIndex(index - 1)}>
            <Icone nom="precedent" taille={20} /> {t('cuisson.precedent')}
          </button>
        )}
        <button className="bouton-cuisson bouton-cuisson-principal" onClick={() => setIndex(index + 1)}>
          {index + 1 === recette.etapes.length ? t('cuisson.termine') : (
            <>
              {t('cuisson.suivant')} <Icone nom="suivant" taille={20} />
            </>
          )}
        </button>
      </div>

    </div>
  )
}

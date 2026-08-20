import { useEffect, useMemo, useState } from 'react'
import type { Recipe, Verdict } from '../types'
import { annoterEtape, formatQuantite } from '../lib/aggregate'
import { formatDuree, minuteursDeLEtape } from '../lib/duree'
import { useWakeLock } from '../hooks/useWakeLock'
import { ecrireProgression, lireProgression, oublierProgression } from '../lib/progressionCuisson'
import Icone from '../components/Icone'

interface MinuteurActif {
  id: string
  nom: string
  /** Sert à calculer la jauge de progression (part écoulée du total). */
  depart: number
  /** Heure de fin absolue, pas un compteur qu'on décrémente : l'écran en
   *  veille ou l'onglet en arrière-plan gèlent les `setInterval`, pas
   *  une heure de fin. */
  fin: number
}

/** Horloge partagée : un seul intervalle pour tous les minuteurs. */
function useMaintenant(actif: boolean): number {
  const [maintenant, setMaintenant] = useState(() => Date.now())

  useEffect(() => {
    if (!actif) return
    setMaintenant(Date.now())
    const t = setInterval(() => setMaintenant(Date.now()), 500)
    return () => clearInterval(t)
  }, [actif])

  return maintenant
}

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

/**
 * Bip de minuteur en Web Audio plutôt qu'un fichier audio : rien à
 * charger, et surtout le contexte peut être créé/débloqué au clic sur
 * « Lancer » (geste utilisateur), pour qu'il joue plus tard sans
 * geste quand le minuteur sonne réellement — un `<audio>` déclenché
 * hors geste se ferait bloquer par l'autoplay des navigateurs.
 */
let contexteAudio: AudioContext | null = null

function debloquerAudio() {
  try {
    contexteAudio ??= new (window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    if (contexteAudio.state === 'suspended') void contexteAudio.resume()
  } catch {
    /* Web Audio indisponible : la vibration reste le seul signal */
  }
}

function biper() {
  const ctx = contexteAudio
  if (!ctx) return
  try {
    const debut = ctx.currentTime
    ;[880, 1175].forEach((frequence, i) => {
      const depart = debut + i * 0.16
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = frequence
      gain.gain.setValueAtTime(0, depart)
      gain.gain.linearRampToValueAtTime(0.35, depart + 0.02)
      gain.gain.linearRampToValueAtTime(0, depart + 0.15)
      osc.connect(gain).connect(ctx.destination)
      osc.start(depart)
      osc.stop(depart + 0.16)
    })
  } catch {
    /* contexte fermé ou bloqué entretemps : tant pis pour ce bip */
  }
}

interface Props {
  recette: Recipe
  onVerdict: (v: Verdict) => void
  onQuitter: () => void
}

export default function Cuisson({ recette, onVerdict, onQuitter }: Props) {
  const [index, setIndex] = useState(-1)
  // Lu une seule fois au montage : la valeur ne doit pas disparaître de
  // l'écran de préparation au moment où on écrit la progression suivante.
  const [reprise] = useState(() => lireProgression(recette.id))
  const [minuteurs, setMinuteurs] = useState<MinuteurActif[]>([])
  const [panneau, setPanneau] = useState(false)
  const maintenant = useMaintenant(minuteurs.length > 0)
  useWakeLock(true)

  const etape = recette.etapes[index] ?? ''
  const proposes = useMemo(() => minuteursDeLEtape(etape), [etape])

  const restantDe = (m: MinuteurActif) => Math.max(0, Math.round((m.fin - maintenant) / 1000))
  const enCours = [...minuteurs].sort((a, b) => a.fin - b.fin)
  const sonnent = minuteurs.filter((m) => m.fin <= maintenant)

  const lancer = (secondes: number, nom: string) => {
    // Débloqué ici (clic = geste utilisateur), pas au moment où le
    // minuteur sonnera réellement — sinon le navigateur bloque le son.
    debloquerAudio()
    const depart = Date.now()
    setMinuteurs((prec) => [...prec, { id: crypto.randomUUID(), nom, depart, fin: depart + secondes * 1000 }])
  }

  const progression = (m: MinuteurActif) => {
    const total = m.fin - m.depart
    if (total <= 0) return 100
    return Math.min(100, Math.max(0, ((maintenant - m.depart) / total) * 100))
  }

  const retirer = (id: string) => setMinuteurs((prec) => prec.filter((m) => m.id !== id))

  // Un bip seul, une vibration seule : trop facile à manquer en
  // cuisine, mains occupées, attention ailleurs. Tant qu'un minuteur
  // sonne sans avoir été retiré, l'alerte se répète et le panneau
  // s'ouvre tout seul — impossible de rater que c'est prêt.
  const yADesTimersQuiSonnent = sonnent.length > 0
  useEffect(() => {
    if (!yADesTimersQuiSonnent) return

    setPanneau(true)
    const alerter = () => {
      if ('vibrate' in navigator) navigator.vibrate([200, 100, 200, 100, 500])
      biper()
    }
    alerter()
    const t = setInterval(alerter, 4000)
    return () => clearInterval(t)
  }, [yADesTimersQuiSonnent])

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
          <div className="progression" aria-hidden="true">
            {recette.etapes.map((_, i) => (
              <i key={i} data-fait={i <= index} />
            ))}
          </div>
        </div>
        {/* Repère à droite pour équilibrer le bouton fermer à gauche —
            le minuteur, lui, vit désormais dans le bandeau ci-dessous,
            trop important pour tenir dans un petit rond. */}
        <span className="cuisson-rond cuisson-rond-vide" aria-hidden="true" />
      </header>

      {/* Bandeau plein largeur plutôt qu'un petit rond dans le header :
          le minuteur est l'info la plus importante pendant l'attente
          entre deux étapes, il mérite de gros chiffres qu'on lit sans
          plisser les yeux depuis l'autre bout de la cuisine. */}
      {enCours.length > 0 && (
        <button
          className="bandeau-minuteur"
          data-sonne={sonnent.length > 0}
          onClick={() => setPanneau(true)}
          aria-label={`${enCours.length} minuteur${enCours.length > 1 ? 's' : ''} en cours, ouvrir la gestion`}
        >
          <div className="bandeau-minuteur-ligne">
            <span className="bandeau-minuteur-nom">
              <Icone nom="minuteur" taille={20} />
              {enCours[0]!.nom}
              {enCours.length > 1 && <i className="pastille-nombre">{enCours.length}</i>}
            </span>
            <b className="bandeau-minuteur-valeur">
              {sonnent.length > 0 ? 'Terminé' : mmss(restantDe(enCours[0]!))}
            </b>
          </div>
          <div className="bandeau-minuteur-jauge" aria-hidden="true">
            <i style={{ width: `${progression(enCours[0]!)}%` }} />
          </div>
        </button>
      )}

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
                onClick={() => lancer(m.secondes, m.nom)}
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

      {panneau && enCours.length > 0 && (
        <>
          <button
            className="voile-panneau"
            onClick={() => setPanneau(false)}
            aria-label="Fermer les minuteurs"
          />
          <div className="panneau-minuteurs" role="dialog" aria-label="Minuteurs en cours">
            <div className="panneau-minuteurs-entete">
              <h2>Minuteurs</h2>
              <button className="cuisson-rond" onClick={() => setPanneau(false)} aria-label="Fermer">
                <Icone nom="fermer" taille={20} />
              </button>
            </div>

            <ul>
              {enCours.map((m) => (
                <li key={m.id} data-sonne={m.fin <= maintenant}>
                  <div>
                    <b>{m.nom}</b>
                    <span>{m.fin <= maintenant ? 'Terminé' : mmss(restantDe(m))}</span>
                  </div>
                  <button
                    className="cuisson-rond"
                    onClick={() => retirer(m.id)}
                    aria-label={`Supprimer le minuteur ${m.nom}`}
                  >
                    <Icone nom="fermer" taille={18} />
                  </button>
                </li>
              ))}
            </ul>

            {enCours.length > 1 && (
              <button
                className="discret suite pleine-largeur"
                onClick={() => {
                  setMinuteurs([])
                  setPanneau(false)
                }}
              >
                Tout supprimer
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

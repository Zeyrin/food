import { useEffect, useState } from 'react'
import type { Recipe } from '../types'
import { validerCollage } from '../lib/collerRecettes'
import { genererPrompt } from '../lib/promptRecette'
import Icone from '../components/Icone'

interface Props {
  onAjouter: (recette: Recipe) => Promise<void>
  onQuitter: () => void
  /** Titres du catalogue, pour écarter un plat déjà présent. */
  titresExistants: string[]
  /** En mode édition : la recette existante, préremplie en JSON. */
  recetteInitiale?: Recipe
}

export default function AjouterRecette({
  onAjouter,
  onQuitter,
  titresExistants,
  recetteInitiale,
}: Props) {
  const [demande, setDemande] = useState('')
  const [texte, setTexte] = useState(() =>
    recetteInitiale
      ? JSON.stringify(
          {
            titre: recetteInitiale.titre,
            temps: recetteInitiale.temps,
            portions: recetteInitiale.portions,
            tags: recetteInitiale.tags,
            ingredients: recetteInitiale.ingredients,
            etapes: recetteInitiale.etapes,
            ...(recetteInitiale.image ? { image: recetteInitiale.image } : {}),
          },
          null,
          2,
        )
      : '',
  )
  const [erreurs, setErreurs] = useState<string[]>([])
  const [enCours, setEnCours] = useState(false)
  const [copie, setCopie] = useState(false)
  /** Nombre de recettes effectivement ajoutées, une fois l'envoi passé. */
  const [ajoutees, setAjoutees] = useState(0)
  /**
   * Le presse-papier n'est pas toujours disponible : absent hors HTTPS,
   * refusé par certains navigateurs hors geste direct, et hors d'usage
   * dans une webview verrouillée. Le bouton ne faisait alors rien du
   * tout, sans un mot. Repli : on affiche le prompt en clair, prêt à
   * être sélectionné à la main.
   */
  const [promptEnClair, setPromptEnClair] = useState<string | null>(null)
  const [doublons, setDoublons] = useState<string[]>([])

  const edition = recetteInitiale !== undefined

  const copierPrompt = async () => {
    const prompt = genererPrompt(demande)
    try {
      await navigator.clipboard.writeText(prompt)
      setPromptEnClair(null)
      setCopie(true)
      setTimeout(() => setCopie(false), 2000)
    } catch {
      setPromptEnClair(prompt)
    }
  }

  const valider = async () => {
    setErreurs([])
    setDoublons([])
    // En modification, le titre du plat qu'on édite n'est pas un doublon
    // de lui-même.
    const dejaLa = edition
      ? titresExistants.filter((t) => t !== recetteInitiale.titre)
      : titresExistants
    const { recettes, erreurs: refusees, doublons: dejaVus } = validerCollage(texte, dejaLa)
    setDoublons(dejaVus)

    if (recettes.length === 0) {
      setErreurs(
        refusees.length > 0
          ? refusees
          : dejaVus.length > 0
            ? []
            : ['Rien à ajouter dans ce collage.'],
      )
      return
    }
    if (edition && recettes.length > 1) {
      setErreurs(['Vous modifiez une recette : collez-en une seule, pas une liste.'])
      return
    }

    setEnCours(true)
    let ajoutOk = 0
    try {
      for (const recette of recettes) {
        await onAjouter(recette)
        ajoutOk++
      }
    } catch (e) {
      setErreurs([e instanceof Error ? e.message : "Échec de l'ajout."])
      setEnCours(false)
      // Une panne réseau au milieu d'un lot : ce qui est passé est
      // passé, on ne le redemande pas — le compteur le dit et le reste
      // reste collé dans le champ.
      setAjoutees(ajoutOk)
      return
    }

    // Ce qui a été refusé ne disparaît pas dans une sortie automatique :
    // l'écran reste ouvert pour dire ce qui manque (voir plus bas).
    setErreurs(refusees)
    setAjoutees(ajoutOk)
  }

  const partiel = ajoutees > 0 && (erreurs.length > 0 || doublons.length > 0)

  // Dans un `useEffect` (pas un `setTimeout` direct dans `valider`) pour
  // que le nettoyage annule l'appel si l'écran se démonte avant —
  // sinon un clic sur « Annuler » juste après l'ajout ferait reculer
  // l'historique deux fois : une fois pour Annuler, une fois pour ce
  // minuteur qui se déclenche quand même sur un `onQuitter` obsolète.
  // On ne referme pas quand une partie du lot a été refusée : il y a
  // quelque chose à lire avant de partir.
  useEffect(() => {
    if (ajoutees === 0 || partiel) return
    const t = setTimeout(onQuitter, 900)
    return () => clearTimeout(t)
  }, [ajoutees, partiel, onQuitter])

  const libelleBouton = () => {
    if (ajoutees > 0) {
      if (edition) return 'Modifications enregistrées !'
      return ajoutees > 1 ? `${ajoutees} recettes ajoutées !` : 'Recette ajoutée !'
    }
    if (enCours) return 'Ajout…'
    return edition ? 'Enregistrer' : 'Ajouter au catalogue'
  }

  return (
    <>
      <header className="entete-app">
        <div className="entete-app-titre">
          <Icone nom="plus-cercle" />
          <h1>{edition ? 'Modifier la recette' : 'Ajouter une recette'}</h1>
        </div>
      </header>
      <p className="aide">
        Saisie automatique : demandez des recettes à une IA avec le prompt ci-dessous, puis collez sa réponse telle
        quelle — bloc de code, phrases autour et liste de plusieurs recettes sont acceptés. Dans les étapes, un
        ingrédient entre accolades — « cuire les {'{pâtes}'} » — s'affiche avec sa dose en mode cuisson.
      </p>

      <h2>1. Le prompt à copier</h2>
      <textarea
        className="champ-texte"
        placeholder="Ce que vous voulez (ex: 5 recettes d'été, végé, en moins de 20 min)…"
        value={demande}
        onChange={(e) => setDemande(e.target.value)}
        rows={2}
      />
      <button className="discret suite pleine-largeur" onClick={copierPrompt}>
        <Icone nom={copie ? 'coche' : 'liste'} taille={18} /> {copie ? 'Copié !' : 'Copier le prompt'}
      </button>
      {promptEnClair !== null && (
        <>
          <p className="aide espace-haut" role="alert">
            Ce navigateur refuse la copie automatique. Sélectionnez le texte ci-dessous et copiez-le à la main.
          </p>
          <textarea
            className="champ-texte champ-texte-code"
            value={promptEnClair}
            readOnly
            rows={6}
            onFocus={(e) => e.currentTarget.select()}
            aria-label="Prompt à copier à la main"
          />
        </>
      )}

      <h2>2. La réponse de l'IA</h2>
      <textarea
        className="champ-texte champ-texte-code"
        placeholder='{ "titre": "...", "temps": 30, ... }'
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        rows={10}
      />

      {doublons.length > 0 && (
        <div className="bloc-doublons" role="status">
          <p>
            Déjà au catalogue, {doublons.length > 1 ? 'laissées' : 'laissée'} de côté :{' '}
            {doublons.map((t) => `« ${t} »`).join(', ')}.
          </p>
        </div>
      )}

      {erreurs.length > 0 && (
        <div className="bloc-erreurs" role="alert">
          {partiel && (
            <p>
              <b>
                {ajoutees} recette{ajoutees > 1 ? 's' : ''} ajoutée{ajoutees > 1 ? 's' : ''}.
              </b>{' '}
              Le reste a été laissé de côté :
            </p>
          )}
          {erreurs.map((e, i) => (
            <p key={i}>{e}</p>
          ))}
        </div>
      )}

      {/* Désactivé une fois le lot passé : recliquer rejouerait tout le
          collage et créerait des doublons. */}
      <button className="principal" onClick={valider} disabled={!texte.trim() || enCours || ajoutees > 0}>
        {ajoutees > 0 && <Icone nom="coche" taille={20} />}
        {libelleBouton()}
      </button>
      <button className="discret suite pleine-largeur" onClick={onQuitter}>
        {partiel ? 'Terminer' : 'Annuler'}
      </button>
    </>
  )
}

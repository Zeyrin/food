import { useState } from 'react'
import type { Recipe } from '../types'
import { validerRecette } from '../lib/validerRecette'
import { genererPrompt } from '../lib/promptRecette'
import Icone from '../components/Icone'

interface Props {
  onAjouter: (recette: Recipe) => Promise<void>
  onQuitter: () => void
  /** En mode édition : la recette existante, préremplie en JSON. */
  recetteInitiale?: Recipe
}

export default function AjouterRecette({ onAjouter, onQuitter, recetteInitiale }: Props) {
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

  const copierPrompt = async () => {
    await navigator.clipboard.writeText(genererPrompt(demande))
    setCopie(true)
    setTimeout(() => setCopie(false), 2000)
  }

  const valider = async () => {
    setErreurs([])
    let json: unknown
    try {
      json = JSON.parse(texte)
    } catch {
      setErreurs(["Le texte collé n'est pas du JSON valide. Vérifiez qu'il n'y a rien avant/après l'accolade."])
      return
    }

    const resultat = validerRecette(json)
    if ('erreurs' in resultat) {
      setErreurs(resultat.erreurs)
      return
    }

    setEnCours(true)
    try {
      await onAjouter(resultat.recette)
      onQuitter()
    } catch (e) {
      setErreurs([e instanceof Error ? e.message : "Échec de l'ajout."])
    } finally {
      setEnCours(false)
    }
  }

  return (
    <>
      <header className="entete-app">
        <div className="entete-app-titre">
          <Icone nom="etoile" />
          <h1>{recetteInitiale ? 'Modifier la recette' : 'Saisie automatique'}</h1>
        </div>
      </header>
      <p className="aide">
        Demandez une recette à une IA avec le prompt ci-dessous, puis collez sa réponse JSON.
      </p>

      <h2>1. Le prompt à copier</h2>
      <textarea
        className="champ-texte"
        placeholder="Ce que vous voulez (ex: une recette d'été, végé, en moins de 20 min)…"
        value={demande}
        onChange={(e) => setDemande(e.target.value)}
        rows={2}
      />
      <button className="discret suite pleine-largeur" onClick={copierPrompt}>
        <Icone nom={copie ? 'coche' : 'liste'} taille={18} /> {copie ? 'Copié !' : 'Copier le prompt'}
      </button>

      <h2>2. La réponse de l'IA</h2>
      <textarea
        className="champ-texte champ-texte-code"
        placeholder='{ "titre": "...", "temps": 30, ... }'
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        rows={10}
      />

      {erreurs.length > 0 && (
        <div className="bloc-erreurs">
          {erreurs.map((e, i) => (
            <p key={i}>{e}</p>
          ))}
        </div>
      )}

      <button className="principal" onClick={valider} disabled={!texte.trim() || enCours}>
        {enCours ? 'Ajout…' : 'Ajouter au catalogue'}
      </button>
      <button className="discret suite pleine-largeur" onClick={onQuitter}>
        Annuler
      </button>
    </>
  )
}

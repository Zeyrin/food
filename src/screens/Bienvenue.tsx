import { useState } from 'react'
import Icone from '../components/Icone'

interface Props {
  onCreer: () => Promise<void>
  onRejoindre: (code: string) => Promise<boolean>
}

export default function Bienvenue({ onCreer, onRejoindre }: Props) {
  const [code, setCode] = useState('')
  const [enCours, setEnCours] = useState<'creation' | 'jonction' | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)

  /**
   * Créer une maison passe par le réseau (le code court doit être
   * unique côté Supabase) : sans état d'attente, l'écran ne bougeait
   * pas — un second appui créait une deuxième maison, et un échec
   * réseau ne disait rien du tout. Pas de remise à zéro après succès :
   * l'écran est démonté dans la foulée.
   */
  const creer = async () => {
    setEnCours('creation')
    setErreur(null)
    try {
      await onCreer()
    } catch {
      setErreur("La maison n'a pas pu être créée. Vérifiez votre connexion et réessayez.")
      setEnCours(null)
    }
  }

  const rejoindre = async () => {
    if (code.trim().length !== 6) return
    setEnCours('jonction')
    setErreur(null)
    try {
      const ok = await onRejoindre(code)
      if (!ok) {
        setErreur('Code introuvable, vérifiez-le.')
        setEnCours(null)
      }
    } catch {
      setErreur('La recherche a échoué. Vérifiez votre connexion et réessayez.')
      setEnCours(null)
    }
  }

  return (
    <>
      <header className="entete-app">
        <div className="entete-app-titre">
          <Icone nom="etoile" />
          <h1>Bienvenue</h1>
        </div>
      </header>
      <p className="aide">Créez votre maison, ou rejoignez celle de quelqu'un avec son code.</p>

      <button className="principal" onClick={creer} disabled={enCours !== null}>
        {enCours === 'creation' ? 'Création…' : 'Créer ma maison'}
      </button>

      <h2>Rejoindre avec un code</h2>
      <input
        className="champ-texte champ-texte-code-court"
        placeholder="A3F9K2"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
        onKeyDown={(e) => e.key === 'Enter' && void rejoindre()}
        maxLength={6}
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="go"
        aria-label="Code du foyer à rejoindre"
      />
      {erreur && (
        <div className="bloc-erreurs" role="alert">
          <p>{erreur}</p>
        </div>
      )}
      <button
        className="discret suite pleine-largeur"
        onClick={rejoindre}
        disabled={code.trim().length !== 6 || enCours !== null}
      >
        {enCours === 'jonction' ? 'Recherche…' : 'Rejoindre'}
      </button>
    </>
  )
}

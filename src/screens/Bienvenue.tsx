import { useState } from 'react'
import Icone from '../components/Icone'

interface Props {
  onCreer: () => void
  onRejoindre: (code: string) => Promise<boolean>
}

export default function Bienvenue({ onCreer, onRejoindre }: Props) {
  const [code, setCode] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState(false)

  const rejoindre = async () => {
    if (code.trim().length !== 6) return
    setEnCours(true)
    setErreur(false)
    const ok = await onRejoindre(code)
    if (!ok) {
      setErreur(true)
      setEnCours(false)
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

      <button className="principal" onClick={onCreer}>
        Créer ma maison
      </button>

      <h2>Rejoindre avec un code</h2>
      <input
        className="champ-texte champ-texte-code-court"
        placeholder="A3F9K2"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
        maxLength={6}
        autoCapitalize="characters"
      />
      {erreur && <div className="bloc-erreurs"><p>Code introuvable, vérifiez-le.</p></div>}
      <button className="discret suite pleine-largeur" onClick={rejoindre} disabled={code.trim().length !== 6 || enCours}>
        {enCours ? 'Recherche…' : 'Rejoindre'}
      </button>
    </>
  )
}

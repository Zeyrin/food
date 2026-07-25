import { useState } from 'react'
import Icone from '../components/Icone'

interface Props {
  codeFoyer: string | null
  onRejoindre: (code: string) => Promise<boolean>
  onQuitter: () => void
  onFermer: () => void
}

export default function Reglages({ codeFoyer, onRejoindre, onQuitter, onFermer }: Props) {
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
          <Icone nom="menu" />
          <h1>Réglages</h1>
        </div>
        <button className="bouton-rond-discret" onClick={onFermer} aria-label="Fermer les réglages">
          <Icone nom="fermer" taille={20} />
        </button>
      </header>

      {codeFoyer && (
        <>
          <h2>Votre foyer</h2>
          <div className="carte-code-foyer">
            <p className="carte-resume-label">Code à partager</p>
            <p className="carte-code-foyer-valeur">{codeFoyer}</p>
          </div>
        </>
      )}

      <h2>Rejoindre un autre foyer</h2>
      <p className="aide">Change la maison que vous partagez — vos recettes et votre liste actuelles resteront accessibles avec leur propre code.</p>
      <input
        className="champ-texte champ-texte-code-court"
        placeholder="A3F9K2"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
        maxLength={6}
        autoCapitalize="characters"
      />
      {erreur && (
        <div className="bloc-erreurs">
          <p>Code introuvable, vérifiez-le.</p>
        </div>
      )}
      <button className="discret suite pleine-largeur" onClick={rejoindre} disabled={code.trim().length !== 6 || enCours}>
        {enCours ? 'Recherche…' : 'Rejoindre'}
      </button>

      <h2>Quitter ce foyer</h2>
      <p className="aide">Retour à l'écran d'accueil, pour en créer un nouveau ou en rejoindre un autre par code.</p>
      <button className="discret suite pleine-largeur" onClick={onQuitter}>
        Quitter le foyer
      </button>
    </>
  )
}

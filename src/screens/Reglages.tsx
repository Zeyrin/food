import { useState } from 'react'
import Icone from '../components/Icone'

interface Props {
  codeFoyer: string | null
  onRejoindre: (code: string) => Promise<boolean>
  onQuitter: () => void
  onFermer: () => void
  onRevoirPresentation: () => void
}

export default function Reglages({
  codeFoyer,
  onRejoindre,
  onQuitter,
  onFermer,
  onRevoirPresentation,
}: Props) {
  const [code, setCode] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [confirmationQuitter, setConfirmationQuitter] = useState(false)

  // La résolution d'un code passe par le réseau : un échec (hors ligne,
  // Supabase injoignable) n'est pas un « code introuvable » et ne doit
  // pas se dire comme tel, ni laisser le bouton bloqué sur « Recherche… ».
  const rejoindre = async () => {
    if (code.trim().length !== 6) return
    setEnCours(true)
    setErreur(null)
    try {
      const ok = await onRejoindre(code)
      if (!ok) {
        setErreur('Code introuvable, vérifiez-le.')
        setEnCours(false)
      }
    } catch {
      setErreur('La recherche a échoué. Vérifiez votre connexion et réessayez.')
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

      <h2>Découvrir l'app</h2>
      <p className="aide">Revoir la présentation des fonctionnalités et comment les utiliser.</p>
      <button className="discret suite pleine-largeur" onClick={onRevoirPresentation}>
        <Icone nom="etoile" taille={18} /> Revoir la présentation
      </button>

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
      <button className="discret suite pleine-largeur" onClick={rejoindre} disabled={code.trim().length !== 6 || enCours}>
        {enCours ? 'Recherche…' : 'Rejoindre'}
      </button>

      <h2>Quitter ce foyer</h2>
      {confirmationQuitter ? (
        <div className="bloc-confirmation" role="alertdialog" aria-label="Confirmer le départ du foyer">
          <p>
            Quitter ce foyer sur cet appareil ? {codeFoyer ? `Notez son code (${codeFoyer}) pour y revenir.` : ''}
          </p>
          <div className="rangee-boutons">
            <button className="discret" onClick={() => setConfirmationQuitter(false)}>
              Annuler
            </button>
            <button className="discret danger" onClick={onQuitter}>
              Quitter
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="aide">
            Retour à l'écran d'accueil, pour en créer un nouveau ou en rejoindre un autre par code.
          </p>
          <button className="discret suite pleine-largeur" onClick={() => setConfirmationQuitter(true)}>
            Quitter le foyer
          </button>
        </>
      )}
    </>
  )
}

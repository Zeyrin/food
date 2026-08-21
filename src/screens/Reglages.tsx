import { useState } from 'react'
import { useInstallation } from '../hooks/useInstallation'
import type { MiseAJour } from '../hooks/useMiseAJour'
import { reinitialiserCache, VERSION_APP } from '../lib/miseAJour'
import Icone from '../components/Icone'

interface Props {
  codeFoyer: string | null
  miseAJour: MiseAJour
  onRejoindre: (code: string) => Promise<boolean>
  onQuitter: () => void
  onFermer: () => void
  onRevoirPresentation: () => void
}

export default function Reglages({
  codeFoyer,
  miseAJour,
  onRejoindre,
  onQuitter,
  onFermer,
  onRevoirPresentation,
}: Props) {
  const installation = useInstallation()
  const [code, setCode] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [confirmationQuitter, setConfirmationQuitter] = useState(false)
  const [reinitialisation, setReinitialisation] = useState(false)

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

      {installation.etat !== 'installee' && (
        <>
          <h2>Installer sur le téléphone</h2>
          <p className="aide">
            Installée, l'app garde vos recettes et votre liste accessibles sans réseau — au rayon surgelés,
            c'est la différence entre une liste et un écran blanc.
          </p>
          {installation.etat === 'possible' ? (
            <button className="discret suite pleine-largeur" onClick={() => void installation.installer()}>
              <Icone nom="plus-cercle" taille={18} /> Installer FFFood
            </button>
          ) : (
            // iOS n'expose aucune API d'installation : reste le geste, à
            // condition de savoir lequel — d'où ces deux lignes.
            <p className="aide">
              Sur iPhone : bouton <b>Partager</b> dans la barre de Safari, puis <b>Sur l'écran d'accueil</b>. Sur
              ordinateur : l'icône d'installation dans la barre d'adresse.
            </p>
          )}
        </>
      )}

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

      <h2>Version de l'app</h2>
      <p className="aide">
        L'app se met à jour toute seule : au démarrage, elle vérifie s'il y a du neuf et l'installe.
        Ce bouton force la vérification tout de suite.
      </p>
      <p className="version-app">Version installée : <b>{VERSION_APP}</b></p>
      {miseAJour.disponible ? (
        <button className="discret suite pleine-largeur" onClick={miseAJour.appliquer}>
          <Icone nom="rafraichir" taille={18} /> Installer la nouvelle version
        </button>
      ) : (
        <button
          className="discret suite pleine-largeur"
          onClick={miseAJour.verifier}
          disabled={miseAJour.verification === 'en-cours'}
        >
          <Icone nom="rafraichir" taille={18} />
          {miseAJour.verification === 'en-cours'
            ? 'Vérification…'
            : miseAJour.verification === 'a-jour'
              ? 'Vous avez la dernière version'
              : 'Vérifier les mises à jour'}
        </button>
      )}

      {/* Le cas où le cache s'entête malgré tout : jusqu'ici il fallait
          supprimer les données de l'app — ce qui emportait le foyer, le
          panier et la liste avec. Ici, seuls les fichiers en cache
          partent, les données restent. */}
      {reinitialisation ? (
        <div className="bloc-confirmation" role="alertdialog" aria-label="Confirmer la réinstallation">
          <p>
            Recharger l'app depuis le réseau ? Vos recettes, votre panier et votre liste sont conservés.
          </p>
          <div className="rangee-boutons">
            <button className="discret" onClick={() => setReinitialisation(false)}>
              Annuler
            </button>
            <button className="discret" onClick={() => void reinitialiserCache()}>
              Recharger
            </button>
          </div>
        </div>
      ) : (
        <button className="lien-discret lien-maj" onClick={() => setReinitialisation(true)}>
          Un souci d'affichage ? Réinstaller la dernière version
        </button>
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

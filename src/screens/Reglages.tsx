import { useState } from 'react'
import { useInstallation } from '../hooks/useInstallation'
import { useLangue } from '../lib/i18n'
import Icone from '../components/Icone'

/**
 * Ni iOS ni Android n'exposent l'un l'API de l'autre : sur iPhone,
 * `beforeinstallprompt` n'existe pas du tout ; sur Android, Chrome
 * peut mettre un moment à l'émettre (ou pas, hors Chrome). Tant que
 * `useInstallation` répond « manuelle », il faut donc dire *où*
 * cliquer selon l'appareil plutôt que de supposer iOS pour tout le
 * monde.
 */
const estIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent)
const estAndroid = () => /Android/.test(navigator.userAgent)

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
  const installation = useInstallation()
  const { langue, definirLangue, t } = useLangue()
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
        setErreur(t('reglages.codeErreurIntrouvable'))
        setEnCours(false)
      }
    } catch {
      setErreur(t('reglages.codeErreurReseau'))
      setEnCours(false)
    }
  }

  return (
    <>
      <header className="entete-app">
        <div className="entete-app-titre">
          <Icone nom="menu" />
          <h1>{t('reglages.titre')}</h1>
        </div>
        <button className="bouton-rond-discret" onClick={onFermer} aria-label={t('reglages.fermer')}>
          <Icone nom="fermer" taille={20} />
        </button>
      </header>

      <h2>{t('reglages.langue')}</h2>
      <div className="rangee-boutons" role="group" aria-label={t('reglages.langue')}>
        <button
          className="discret"
          aria-pressed={langue === 'fr'}
          onClick={() => definirLangue('fr')}
        >
          Français
        </button>
        <button
          className="discret"
          aria-pressed={langue === 'en'}
          onClick={() => definirLangue('en')}
        >
          English
        </button>
      </div>

      {installation.etat !== 'installee' && (
        <>
          <h2>{t('reglages.installerTitre')}</h2>
          <p className="aide">{t('reglages.installerTexte')}</p>
          {installation.etat === 'possible' ? (
            <button className="discret suite pleine-largeur" onClick={() => void installation.installer()}>
              <Icone nom="plus-cercle" taille={18} /> {t('reglages.installerBouton')}
            </button>
          ) : estIOS() ? (
            // iOS n'expose aucune API d'installation : reste le geste, à
            // condition de savoir lequel.
            <p className="aide">
              {langue === 'fr' ? (
                <>
                  Sur iPhone : bouton <b>{t('reglages.partager')}</b> dans la barre de Safari, puis{' '}
                  <b>{t('reglages.ecranAccueil')}</b>.
                </>
              ) : (
                <>
                  On iPhone: <b>{t('reglages.partager')}</b> button in the Safari bar, then{' '}
                  <b>{t('reglages.ecranAccueil')}</b>.
                </>
              )}
            </p>
          ) : estAndroid() ? (
            // Chrome/Android émet `beforeinstallprompt` avec un peu de
            // retard (ou pas du tout hors Chrome) : le geste manuel reste
            // utile même sur Android.
            <p className="aide">
              {langue === 'fr' ? (
                <>
                  Sur Android (Chrome) : menu <b>⋮</b> en haut à droite, puis{' '}
                  <b>{t('reglages.ajouterEcranAndroid')}</b>.
                </>
              ) : (
                <>
                  On Android (Chrome): <b>⋮</b> menu top right, then <b>{t('reglages.ajouterEcranAndroid')}</b>.
                </>
              )}
            </p>
          ) : (
            <p className="aide">{t('reglages.installerOrdinateur')}</p>
          )}
        </>
      )}

      <h2>{t('reglages.decouvrirTitre')}</h2>
      <p className="aide">{t('reglages.decouvrirTexte')}</p>
      <button className="discret suite pleine-largeur" onClick={onRevoirPresentation}>
        <Icone nom="etoile" taille={18} /> {t('reglages.revoirPresentation')}
      </button>

      {codeFoyer && (
        <>
          <h2>{t('reglages.votreFoyer')}</h2>
          <div className="carte-code-foyer">
            <p className="carte-resume-label">{t('reglages.codeAPartager')}</p>
            <p className="carte-code-foyer-valeur">{codeFoyer}</p>
          </div>
        </>
      )}

      <h2>{t('reglages.rejoindreAutreFoyer')}</h2>
      <p className="aide">{t('reglages.rejoindreAutreFoyerTexte')}</p>
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
        aria-label={t('reglages.codeLabel')}
      />
      {erreur && (
        <div className="bloc-erreurs" role="alert">
          <p>{erreur}</p>
        </div>
      )}
      <button className="discret suite pleine-largeur" onClick={rejoindre} disabled={code.trim().length !== 6 || enCours}>
        {enCours ? t('reglages.recherche') : t('reglages.rejoindre')}
      </button>

      <h2>{t('reglages.quitterFoyer')}</h2>
      {confirmationQuitter ? (
        <div className="bloc-confirmation" role="alertdialog" aria-label={t('reglages.quitterFoyer')}>
          <p>
            {t('reglages.quitterConfirmation', {
              code: codeFoyer ? t('reglages.quitterConfirmationCode', { code: codeFoyer }) : '',
            })}
          </p>
          <div className="rangee-boutons">
            <button className="discret" onClick={() => setConfirmationQuitter(false)}>
              {t('reglages.annuler')}
            </button>
            <button className="discret danger" onClick={onQuitter}>
              {t('reglages.quitter')}
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="aide">{t('reglages.quitterTexte')}</p>
          <button className="discret suite pleine-largeur" onClick={() => setConfirmationQuitter(true)}>
            {t('reglages.quitterFoyerBouton')}
          </button>
        </>
      )}

      {/* Les photos de plats viennent en partie de Wikimedia Commons, sous
          licences Creative Commons qui demandent de citer l'auteur : la page
          de crédits doit donc être atteignable depuis l'app, pas seulement
          depuis le dépôt. */}
      <h2>{t('reglages.creditsPhoto')}</h2>
      <p className="aide">
        {t('reglages.creditsPhotoTexte')}{' '}
        <a href="/credits.html" target="_blank" rel="noopener noreferrer">
          {t('reglages.voirListe')}
        </a>
        .
      </p>
    </>
  )
}

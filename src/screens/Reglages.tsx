import { useState } from 'react'
import { useInstallation } from '../hooks/useInstallation'
import type { MiseAJour } from '../hooks/useMiseAJour'
import { reinitialiserCache, VERSION_APP } from '../lib/miseAJour'
import { useLangue } from '../lib/i18n'
import type { ConfigMagasins } from '../lib/magasins'
import { magasinDuRayon } from '../lib/magasins'
import { RAYONS, RAYONS_ORDONNES, type RayonId } from '../types'
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
  magasins: ConfigMagasins
  onMagasins: (config: ConfigMagasins) => void
  codeFoyer: string | null
  miseAJour: MiseAJour
  onRejoindre: (code: string) => Promise<boolean>
  onQuitter: () => void
  onFermer: () => void
  onRevoirPresentation: () => void
}

export default function Reglages({
  magasins,
  onMagasins,
  codeFoyer,
  miseAJour,
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
  const [reinitialisation, setReinitialisation] = useState(false)

  const labelRayon = (rayon: RayonId) => {
    const traduit = t(`rayons.${rayon}`)
    return traduit === `rayons.${rayon}` ? RAYONS[rayon].label : traduit
  }

  const nomAffiche = (nom: string, i: number) =>
    nom.trim() || (i === 0 ? t('reglages.magasinPrincipal') : t('reglages.magasinSansNom'))

  const renommer = (id: string, nom: string) =>
    onMagasins({ ...magasins, magasins: magasins.magasins.map((m) => (m.id === id ? { ...m, nom } : m)) })

  const ajouterMagasin = () =>
    onMagasins({
      ...magasins,
      magasins: [...magasins.magasins, { id: crypto.randomUUID(), nom: '' }],
    })

  // Le routage n'est pas nettoyé ici : `normaliserConfig` laisse tomber
  // les rayons qui pointaient vers ce magasin, et ils retournent au
  // premier. Un rayon ne peut donc pas disparaître de la liste.
  const supprimerMagasin = (id: string) =>
    onMagasins({ ...magasins, magasins: magasins.magasins.filter((m) => m.id !== id) })

  /** L'ordre des magasins est l'ordre du parcours : on doit pouvoir
   *  remonter celui par lequel on commence. */
  const monterMagasin = (i: number) => {
    const suivant = [...magasins.magasins]
    const [m] = suivant.splice(i, 1)
    suivant.splice(i - 1, 0, m!)
    onMagasins({ ...magasins, magasins: suivant })
  }

  const affecter = (rayon: RayonId, magasinId: string) =>
    onMagasins({ ...magasins, routage: { ...magasins.routage, [rayon]: magasinId } })

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

      {/* Les rayons sont les mêmes pour tout le monde, les magasins non :
          la plupart des gens font un seul magasin, certains prennent
          leurs légumes ailleurs. D'où un magasin par défaut — la liste
          n'est alors qu'une suite de rayons — et l'ajout d'un second qui
          coupe la liste en autant d'arrêts. */}
      <h2>{t('reglages.magasinsTitre')}</h2>
      <p className="aide">{t('reglages.magasinsTexte')}</p>

      {magasins.magasins.map((m, i) => (
        <div className="rangee-magasin" key={m.id}>
          <input
            className="champ-texte"
            value={m.nom}
            placeholder={i === 0 ? t('reglages.magasinPrincipal') : t('reglages.magasinSansNom')}
            onChange={(e) => renommer(m.id, e.target.value)}
            aria-label={t('reglages.nomDuMagasin', { n: i + 1 })}
          />
          {i > 0 && (
            <button
              className="bouton-suppr pivot-monter"
              onClick={() => monterMagasin(i)}
              aria-label={t('reglages.monterMagasin', { nom: nomAffiche(m.nom, i) })}
            >
              <Icone nom="precedent" taille={18} />
            </button>
          )}
          {magasins.magasins.length > 1 && (
            <button
              className="bouton-suppr"
              onClick={() => supprimerMagasin(m.id)}
              aria-label={t('reglages.supprimerMagasin', { nom: nomAffiche(m.nom, i) })}
            >
              <Icone nom="fermer" taille={16} />
            </button>
          )}
        </div>
      ))}

      <button className="discret suite pleine-largeur" onClick={ajouterMagasin}>
        <Icone nom="plus-cercle" taille={18} /> {t('reglages.ajouterMagasin')}
      </button>

      {magasins.magasins.length > 1 && (
        <>
          <h3 className="titre-secondaire">{t('reglages.routageTitre')}</h3>
          <p className="aide">{t('reglages.routageTexte')}</p>
          {RAYONS_ORDONNES.map((rayon) => (
            <div className="rangee-routage" key={rayon}>
              <span className="rangee-routage-rayon">
                <span className="badge-section" data-rayon={rayon}>
                  <Icone nom={RAYONS[rayon].icone} taille={18} />
                </span>
                {labelRayon(rayon)}
              </span>
              <select
                className="champ-select"
                value={magasinDuRayon(rayon, magasins).id}
                onChange={(e) => affecter(rayon, e.target.value)}
                aria-label={t('reglages.ouPrendreRayon', { rayon: labelRayon(rayon) })}
              >
                {magasins.magasins.map((m, i) => (
                  <option key={m.id} value={m.id}>
                    {nomAffiche(m.nom, i)}
                  </option>
                ))}
              </select>
            </div>
          ))}
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

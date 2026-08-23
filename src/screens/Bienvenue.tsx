import { useEffect, useState } from 'react'
import Icone from '../components/Icone'
import { suivre } from '../lib/analytique'
import { useLangue } from '../lib/i18n'

interface Props {
  onCreer: () => Promise<void>
  onRejoindre: (code: string) => Promise<boolean>
}

export default function Bienvenue({ onCreer, onRejoindre }: Props) {
  const { t } = useLangue()
  const [code, setCode] = useState('')
  const [enCours, setEnCours] = useState<'creation' | 'jonction' | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)

  /**
   * Cet écran n'a pas d'adresse à lui — il s'affiche à la place de
   * toute l'app, avant qu'il y ait une pile d'écrans. Sans cet
   * événement, ceux qui n'arrivent jamais à créer ou rejoindre une
   * maison seraient invisibles : ils comptent pour une page vue sur
   * l'accueil, exactement comme ceux qui sont déjà entrés.
   */
  useEffect(() => suivre('bienvenue_vue'), [])

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
      suivre('foyer_cree_echec')
      setErreur(t('bienvenue.creerErreur'))
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
        setErreur(t('bienvenue.codeErreurIntrouvable'))
        setEnCours(null)
      }
    } catch {
      suivre('foyer_rejoint', { resultat: 'reseau' })
      setErreur(t('bienvenue.codeErreurReseau'))
      setEnCours(null)
    }
  }

  return (
    <>
      <header className="entete-app">
        <div className="entete-app-titre">
          <Icone nom="etoile" />
          <h1>{t('bienvenue.titre')}</h1>
        </div>
      </header>
      <p className="aide">{t('bienvenue.intro')}</p>

      <button className="principal" onClick={creer} disabled={enCours !== null}>
        {enCours === 'creation' ? t('bienvenue.creation') : t('bienvenue.creerMaMaison')}
      </button>

      <h2>{t('bienvenue.rejoindreAvecCode')}</h2>
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
        aria-label={t('bienvenue.codeLabel')}
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
        {enCours === 'jonction' ? t('bienvenue.recherche') : t('bienvenue.rejoindre')}
      </button>
    </>
  )
}

import { useState } from 'react'
import Icone from '../components/Icone'
import { useLangue } from '../lib/i18n'
import { partageActif } from '../lib/sync'

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
      setErreur(t('bienvenue.codeErreurReseau'))
      setEnCours(null)
    }
  }

  return (
    <main className="accueil">
      {/* Premier écran de l'app, et le seul qui n'ait rien à montrer :
          pas de recette, pas de liste, rien à reprendre. Il présente donc
          le produit — sceau, nom, promesse — avant de demander la seule
          décision qu'il réclame, créer ou rejoindre. Le bloc de marque
          occupe la place libre, les actions restent au pouce. */}
      <div className="accueil-marque">
        <span className="accueil-sceau" aria-hidden="true">
          <Icone nom="grill" taille={30} />
        </span>
        <p className="accueil-surtitre">{t('bienvenue.titre')}</p>
        <h1 className="accueil-nom">FFFood</h1>
        <p className="accueil-baseline">{t('bienvenue.intro')}</p>
      </div>

      <div className="accueil-actions">
        <button className="principal" onClick={creer} disabled={enCours !== null}>
          {enCours === 'creation' ? t('bienvenue.creation') : t('bienvenue.creerMaMaison')}
        </button>

        {/* Deux chemins de même rang, pas une action et son repli : le
            filet les sépare au lieu d'un titre de section qui hiérarchise. */}
        <p className="accueil-ou">
          <span>{t('bienvenue.ou')}</span>
        </p>

        <label className="accueil-champ">
          <span className="accueil-legende">{t('bienvenue.rejoindreAvecCode')}</span>
          {/* Dire pourquoi ça ne marchera pas, plutôt que de laisser saisir
              six caractères pour répondre « code introuvable ». */}
          {!partageActif && <span className="accueil-note">{t('bienvenue.partageInactif')}</span>}
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
            disabled={!partageActif}
            aria-label={t('bienvenue.codeLabel')}
          />
        </label>

        {erreur && (
          <div className="bloc-erreurs" role="alert">
            <p>{erreur}</p>
          </div>
        )}

        <button
          className="discret suite pleine-largeur"
          onClick={rejoindre}
          disabled={!partageActif || code.trim().length !== 6 || enCours !== null}
        >
          {enCours === 'jonction' ? t('bienvenue.recherche') : t('bienvenue.rejoindre')}
        </button>
      </div>
    </main>
  )
}

import { useState } from 'react'
import { useLangue } from '../lib/i18n'
import { envoyerRetour, partageActif } from '../lib/sync'
import { VERSION_APP } from '../lib/miseAJour'
import Icone from './Icone'

interface Props {
  /** Où on était au moment d'ouvrir le panneau — un repère de plus pour situer le retour, jamais du contenu personnel. */
  onglet: string
}

/**
 * Bouton flottant, visible sur tous les écrans principaux — pas de compte,
 * pas de ticket, pas de détour par un formulaire de support hors de l'app.
 * Le panneau s'ouvre par-dessus l'écran en cours sans y naviguer : fermé
 * sans envoyer, on retrouve exactement ce qu'on regardait.
 */
export default function Retour({ onglet }: Props) {
  const { langue, t } = useLangue()
  const [ouvert, setOuvert] = useState(false)
  const [texte, setTexte] = useState('')
  const [contact, setContact] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [envoye, setEnvoye] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const fermer = () => {
    setOuvert(false)
    setTexte('')
    setContact('')
    setErreur(null)
    setEnvoye(false)
  }

  const envoyer = async () => {
    if (!texte.trim()) {
      setErreur(t('retour.champVide'))
      return
    }
    setEnCours(true)
    setErreur(null)
    const ok = await envoyerRetour(texte.trim(), contact.trim() || null, { onglet, langue, version: VERSION_APP })
    setEnCours(false)
    if (!ok) {
      setErreur(t('retour.echec'))
      return
    }
    setEnvoye(true)
    // Laisse voir le remerciement avant de refermer — un envoi qui referme
    // aussitôt le panneau se lit comme un échec silencieux.
    setTimeout(fermer, 1800)
  }

  return (
    <>
      <button
        className="bouton-rond-discret bouton-retour-global"
        onClick={() => setOuvert(true)}
        aria-label={t('retour.ouvrir')}
      >
        <Icone nom="bulle" taille={20} />
      </button>

      {ouvert && (
        <>
          <button className="voile-panneau" onClick={fermer} aria-label={t('retour.fermer')} />
          <div className="panneau-retour" role="dialog" aria-label={t('retour.titre')}>
            {envoye ? (
              <p className="panneau-retour-envoye">
                <Icone nom="coche" taille={22} /> {t('retour.envoye')}
              </p>
            ) : (
              <>
                <div className="panneau-retour-entete">
                  <h2>{t('retour.titre')}</h2>
                  <button className="bouton-rond-discret" onClick={fermer} aria-label={t('retour.fermer')}>
                    <Icone nom="fermer" taille={20} />
                  </button>
                </div>
                <p className="aide">{t('retour.texte')}</p>

                {!partageActif ? (
                  <p className="aide">{t('retour.indisponible')}</p>
                ) : (
                  <>
                    <textarea
                      className="champ-texte"
                      rows={4}
                      value={texte}
                      onChange={(e) => {
                        setTexte(e.target.value)
                        setErreur(null)
                      }}
                      placeholder={t('retour.champPlaceholder')}
                      aria-label={t('retour.champLabel')}
                      autoFocus
                    />
                    <input
                      className="champ-texte champ-retour-contact"
                      type="text"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder={t('retour.contactPlaceholder')}
                      aria-label={t('retour.contactLabel')}
                    />

                    {erreur && (
                      <div className="bloc-erreurs" role="alert">
                        <p>{erreur}</p>
                      </div>
                    )}

                    <button
                      className="discret accent suite pleine-largeur"
                      onClick={() => void envoyer()}
                      disabled={enCours}
                    >
                      {enCours ? t('retour.envoiEnCours') : t('retour.envoyer')}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </>
      )}
    </>
  )
}

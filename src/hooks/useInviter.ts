import { useEffect, useState } from 'react'
import { useLangue } from '../lib/i18n'
import { lienInvitation } from '../lib/invitation'
import { mesurer } from '../lib/mesure'
import { partagerOuCopier } from '../lib/natif'

/**
 * Inviter quelqu'un dans sa maison : la feuille de partage avec une phrase
 * prête à envoyer et le lien de la maison, plutôt qu'un code de six
 * caractères à recopier. Le même geste sert depuis Réglages et depuis la
 * liste, là où l'on se dit que quelqu'un d'autre pourrait faire les courses.
 */
export function useInviter(foyer: string, prenom: string) {
  const { t } = useLangue()
  const [copie, setCopie] = useState(false)

  // Le « Lien copié » retombe tout seul, comme le « Copié » du code.
  useEffect(() => {
    if (!copie) return
    const minuterie = setTimeout(() => setCopie(false), 2000)
    return () => clearTimeout(minuterie)
  }, [copie])

  const inviter = async () => {
    const lien = lienInvitation(foyer, prenom)
    const texte = prenom.trim()
      ? t('inviter.messageDe', { de: prenom.trim(), lien })
      : t('inviter.message', { lien })
    try {
      const resultat = await partagerOuCopier(t('inviter.titre'), texte)
      if (resultat === 'annule') return
      mesurer('invitation_envoyee', { voie: resultat })
      if (resultat === 'copie') setCopie(true)
    } catch {
      // Ni partage ni presse-papiers (certaines vues web) : le texte à
      // sélectionner à la main, comme le bandeau des apps sociales.
      window.prompt(t('inviter.copierAMain'), texte)
    }
  }

  return { inviter, copie }
}

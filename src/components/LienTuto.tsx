import { useEnLigne } from '../hooks/useEnLigne'
import { useLangue } from '../lib/i18n'
import Icone from './Icone'

/**
 * Le tuto vidéo d'une recette, quand elle en a un. Un lien sortant, et
 * rien d'autre : pas de `<iframe>` d'un lecteur tiers, qui ferait entrer
 * du pistage dans une app qui n'en a aucun, et pas de fichier précaché,
 * qui rendrait l'installation hors ligne absurde à quelques mégaoctets
 * par recette (voir le champ `video` de `types.ts`).
 *
 * D'où la seule chose que ce composant a vraiment à faire : dire que ce
 * lien-là, contrairement au reste de l'app, a besoin du réseau. Hors
 * ligne il reste affiché mais inerte — le masquer laisserait croire que
 * la recette n'a pas de tuto, et le laisser cliquable mènerait à la page
 * d'erreur du navigateur, hors de l'app, sans retour évident sur un
 * téléphone.
 *
 * Le même bloc sert la fiche (`screens/DetailRecette.tsx`) et l'écran de
 * préparation du mode cuisson (`screens/Cuisson.tsx`) : on regarde le
 * geste avant de s'y mettre, pas seulement en choisissant le plat.
 */
export default function LienTuto({ video }: { video?: string }) {
  const { t } = useLangue()
  const enLigne = useEnLigne()

  if (!video) return null

  return (
    <div className="bloc-tuto">
      {enLigne ? (
        <a className="lien-tuto" href={video} target="_blank" rel="noopener noreferrer">
          <Icone nom="lecture" taille={18} /> {t('tuto.voir')}
        </a>
      ) : (
        // `aria-disabled` et non `disabled` : ce n'est pas un bouton, et
        // un lien sans `href` sort du parcours au clavier — l'annoncer
        // désactivé vaut mieux que le faire disparaître du focus.
        <span className="lien-tuto lien-tuto-inerte" aria-disabled="true">
          <Icone nom="lecture" taille={18} /> {t('tuto.voir')}
        </span>
      )}
      <p className="aide">{enLigne ? t('tuto.aide') : t('tuto.horsLigne')}</p>
    </div>
  )
}
